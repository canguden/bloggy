/** For interactive objects (a website, an opportunity, an article) — not for wrapping static text. */
export function Card({
  className = "",
  interactive = false,
  children,
}: {
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-line bg-paper-raised ${
        interactive ? "transition-colors duration-[var(--dur-color)] hover:border-line-2" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
