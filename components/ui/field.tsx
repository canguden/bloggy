import { forwardRef, useId } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: (inputProps: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
};

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[var(--text-sm)] font-medium text-[var(--text-primary)]">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[var(--text-xs)] text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[var(--text-xs)] text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`h-10 rounded-[var(--radius-sm)] border bg-[var(--surface-raised)] px-3 text-[var(--text-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors ${
      invalid ? "border-[var(--danger)]" : "border-[var(--border-strong)] focus:border-[var(--accent)]"
    } ${className}`}
    {...props}
  />
));
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`rounded-[var(--radius-sm)] border bg-[var(--surface-raised)] px-3 py-2 text-[var(--text-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors ${
        invalid ? "border-[var(--danger)]" : "border-[var(--border-strong)] focus:border-[var(--accent)]"
      } ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
