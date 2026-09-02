import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Create your account — Bloggy" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">Create your account</h1>
      <p className="mb-6 text-[var(--text-sm)] text-[var(--text-secondary)]">
        Give Bloggy your website and it will tell you what to write next.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-[var(--text-sm)] text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
