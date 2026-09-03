import Link from "next/link";
import { FiCompass } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-32 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-inset text-ink-3">
        <FiCompass size={18} />
      </div>
      <h1 className="text-[15px] font-semibold text-ink">Page not found</h1>
      <p className="text-[13.5px] text-ink-2">This page doesn&apos;t exist, or it moved.</p>
      <Link href="/" className="mt-2">
        <Button variant="secondary" size="sm">
          Back home
        </Button>
      </Link>
    </div>
  );
}
