import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "./ui";

// When the catalogue can't be loaded, say so instead of showing an empty page
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[28px] bg-card px-6 py-16 text-center">
      <div className="mb-5 grid size-20 place-items-center rounded-full bg-danger-soft">
        <WifiOff size={30} className="text-danger" strokeWidth={1.8} />
      </div>
      <p className="text-lg font-bold">We couldn't load the gifts</p>
      <p className="mt-1.5 mb-6 max-w-sm text-sm text-muted">{message}</p>
      <Button variant="dark" size="md" icon={RefreshCw} onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
