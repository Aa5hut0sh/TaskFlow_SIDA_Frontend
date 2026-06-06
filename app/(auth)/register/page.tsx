"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

const baseSchema = {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.enum([
    "FRONTEND",
    "BACKEND",
    "FULLSTACK",
    "DEVOPS",
    "QA",
    "UI_UX",
  ]),
};

const userSchema = z.object({ ...baseSchema });
const adminSchema = z.object({
  ...baseSchema,
  adminSecret: z.string().min(1, "Admin secret is required"),
});

type FormValues = z.infer<typeof adminSchema>;

export default function RegisterPage() {
  const { login } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(isAdmin ? adminSchema : userSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      department: "FULLSTACK",
      adminSecret: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setGlobalError("");
    const loadingId = toast.loading("Creating account...");

    try {
      let response;

      if (isAdmin) {
        response = await authService.registerAdmin({
          name: data.name,
          email: data.email,
          password: data.password,
          department: data.department,
          adminSecret: data.adminSecret,
        });
      } else {
        response = await authService.register({
          name: data.name,
          email: data.email,
          password: data.password,
          department: data.department,
        });
      }

      if (response.success) {
        toast.dismiss(loadingId);
        toast.success("Registration successful!");
        login(response.token, response.user);
      }
    } catch (error: any) {
      toast.dismiss(loadingId);
      const errorMessage =
        error.response?.data?.message || "Failed to register.";
      toast.error("Registration Failed", { description: errorMessage });
      setGlobalError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 w-full rounded-xl border-gray-200 bg-gray-50">
                          <SelectValue placeholder="Select department..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                        <SelectItem value="FULLSTACK">FullStack</SelectItem>
                        <SelectItem value="FRONTEND">Frontend</SelectItem>
                        <SelectItem value="BACKEND">Backend</SelectItem>
                        <SelectItem value="DEVOPS">DevOps</SelectItem>
                        <SelectItem value="QA">QA</SelectItem>
                        <SelectItem value="UI_UX">UI/UX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Standard React Checkbox linked to state */}
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <input
                  type="checkbox"
                  id="adminToggle"
                  className="h-4 w-4 mt-1"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="adminToggle"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Register as Administrator
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Requires system admin secret.
                  </p>
                </div>
              </div>

              {/* Conditionally render the Admin Secret field */}
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="adminSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Secret Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter admin secret..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {globalError && (
                <div className="text-sm font-medium text-destructive text-center">
                  {globalError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Creating account..."
                  : "Sign Up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Log in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
