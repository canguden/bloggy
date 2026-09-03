import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Create your account — Bloggy" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">Create your account</h1>
      <p className="mt-1.5 mb-7 text-[13.5px] text-ink-2">Free while you try it. No credit card.</p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-[13.5px] text-ink-3">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-ink hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
