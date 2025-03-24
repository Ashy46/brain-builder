"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { z } from "zod";

import { useAuth } from "@/lib/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const router = useRouter();

  const { signUp, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      const result = signupSchema.safeParse({
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        const errors: {
          email?: string;
          password?: string;
          confirmPassword?: string;
        } = {};
        result.error.errors.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            errors[error.path[0] as "email" | "password" | "confirmPassword"] =
              error.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setIsLoading(true);
      const signupResult = await signUp(email, password);
      if (!signupResult?.error) {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Sign up to get started
                </p>
              </div>
              {authError && (
                <div className="text-sm text-destructive text-center">
                  {authError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive">
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/auth/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
