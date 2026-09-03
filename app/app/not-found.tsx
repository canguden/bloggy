import Link from "next/link";
import { FiCompass } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-inset text-ink-3">
        <FiCompass size={18} />
      </div>
      <h1 className="text-[15px] font-semibold text-ink">Not found</h1>
      <p className="text-[13.5px] text-ink-2">This isn&apos;t here, or it was removed.</p>
      <Link href="/app" className="mt-2">
        <Button variant="secondary" size="sm">
          Go to dashboard
        </Button>
      </Link>
    </div>
  );
}
