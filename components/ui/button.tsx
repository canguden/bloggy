import { forwardRef } from "react";
import { FiLoader } from "react-icons/fi";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--border-strong)]",
  secondary:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[var(--text-sm)] gap-1.5",
  md: "h-10 px-4 text-[var(--text-base)] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && <FiLoader className="animate-spin" size={14} aria-hidden />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
