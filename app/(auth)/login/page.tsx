import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in — Bloggy" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">Welcome back</h1>
      <p className="mt-1.5 mb-7 text-[13.5px] text-ink-2">Sign in to your workspace.</p>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-[13.5px] text-ink-3">
        New to Bloggy?{" "}
        <Link href="/signup" className="font-medium text-accent-ink hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
