import { FiX } from "react-icons/fi";

/** Small hairline pill for tags, offerings, audiences — not a status badge. */
export function Chip({
  children,
  onRemove,
  icon,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-paper px-3 py-1 text-[12.5px] text-ink-2">
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
          className="-mr-1 flex h-4 w-4 items-center justify-center rounded-full text-ink-3 hover:bg-paper-inset hover:text-ink"
        >
          <FiX size={11} />
        </button>
      )}
    </span>
  );
}
