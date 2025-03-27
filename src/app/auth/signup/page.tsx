"use client";

import { Card, CardContent } from "@/components/ui/card";

import { SignupForm } from "./form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6">
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
