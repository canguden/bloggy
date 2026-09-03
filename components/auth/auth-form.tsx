"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth/auth-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === "signup"
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(mode === "signup" ? "/onboarding" : "/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {mode === "signup" && (
        <Field label="Name">
          {(inputProps) => (
            <Input
              {...inputProps}
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
      )}

      <Field label="Email">
        {(inputProps) => (
          <Input
            {...inputProps}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>

      <Field
        label="Password"
        hint={mode === "signup" ? "At least 8 characters." : undefined}
        error={error ?? undefined}
      >
        {(inputProps) => (
          <div className="relative">
            <Input
              {...inputProps}
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
            >
              {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>
        )}
      </Field>

      <Button type="submit" loading={submitting} className="mt-1 w-full">
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
