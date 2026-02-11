"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export const LoginForm = () => {

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData) {
        setLoading(true);
        setError("");

        const result = await login(formData)

        if(result?.error){
            setError(result.error);
            setLoading(false);
        } 

    }

    return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded bg-red-100 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-600 underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}