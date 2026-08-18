"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";

export function StudentSignInForm() {
  const router = useRouter();
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("student", {
      registerNumber,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid registration number or password");
      return;
    }

    router.push("/post-login");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="student-reg-no">Registration number</Label>
        <Input
          id="student-reg-no"
          value={registerNumber}
          onChange={(e) => setRegisterNumber(e.target.value)}
          required
          autoComplete="username"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="student-password">Password</Label>
        <PasswordInput
          id="student-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
