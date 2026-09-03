import { forwardRef } from "react";
import { CgSpinner } from "react-icons/cg";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-action text-action-ink hover:bg-action-hover disabled:bg-line-2",
  secondary: "bg-transparent text-ink border border-line-2 hover:bg-paper-sunken",
  ghost: "bg-transparent text-ink-2 hover:bg-paper-sunken hover:text-ink",
  danger: "bg-transparent text-bad border border-line-2 hover:bg-bad-weak hover:border-bad",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-[14.5px] gap-2",
  lg: "h-12 px-6 text-[15.5px] gap-2",
};

/**
 * Pill-shaped by default (radius-full) — the black pill is the app's one
 * unmistakable "do this" signal. `loading` keeps the label but swaps it to a
 * spinner-prefixed state and preserves width so nothing reflows.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, iconLeft, iconRight, className = "", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors duration-[var(--dur-color)] ease-[var(--ease)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading ? <CgSpinner className="animate-spin" size={16} aria-hidden /> : iconLeft}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
