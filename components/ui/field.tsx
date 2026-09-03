import { forwardRef, useId } from "react";
import { FiAlertCircle } from "react-icons/fi";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (inputProps: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => React.ReactNode;
};

export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {optional && <span className="text-[12px] text-ink-3">Optional</span>}
      </div>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[12.5px] text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-[12.5px] text-bad">
          <FiAlertCircle size={13} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

const controlClasses = (invalid?: boolean) =>
  `h-10 rounded-[var(--radius-sm)] border bg-paper px-3.5 text-[14.5px] text-ink placeholder:text-ink-3 outline-none transition-colors duration-[var(--dur-color)] ${
    invalid ? "border-bad" : "border-line-2 focus:border-ink"
  }`;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className = "", ...props }, ref) => (
  <input ref={ref} className={`${controlClasses(invalid)} ${className}`} {...props} />
));
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`rounded-[var(--radius-sm)] border bg-paper px-3.5 py-2.5 text-[14.5px] leading-relaxed text-ink placeholder:text-ink-3 outline-none transition-colors duration-[var(--dur-color)] ${
        invalid ? "border-bad" : "border-line-2 focus:border-ink"
      } ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
