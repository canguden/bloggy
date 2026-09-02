import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in — Bloggy" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">Welcome back</h1>
      <p className="mb-6 text-[var(--text-sm)] text-[var(--text-secondary)]">
        Sign in to your workspace.
      </p>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-[var(--text-sm)] text-[var(--text-secondary)]">
        New to Bloggy?{" "}
        <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
