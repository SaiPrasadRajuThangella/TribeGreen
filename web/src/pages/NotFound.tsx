import { ArrowRight, Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui";
import { useSeo } from "@/hooks/useSeo";

export default function NotFound() {
  useSeo({
    title: "Page not found",
    description: "The page you were looking for doesn't exist.",
    noindex: true,
  });

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="mb-6 grid size-24 place-items-center rounded-full bg-lime-soft">
        <Compass size={36} className="text-lime-ink" strokeWidth={1.8} />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">This page wandered off</h1>
      <p className="mt-3 mb-8 max-w-sm text-muted">
        The link may be old or mistyped. The catalogue is a good place to start again.
      </p>
      <ButtonLink to="/catalogue" variant="dark" iconRight={ArrowRight}>
        Browse catalogue
      </ButtonLink>
    </div>
  );
}
