import { useEffect, useState } from "react";

import { trackEnquiries } from "@/lib/api";
import { useMyEnquiries } from "@/store";
import type { Enquiry } from "@/types";

const REFRESH_MS = 20000;

// The visitor's own enquiries, kept fresh so admin updates show up without a reload
export function useTrackedEnquiries() {
  const refs = useMyEnquiries((s) => s.refs);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reload when an enquiry is added or its call-back number changes
  const key = refs.map((r) => `${r.id}:${r.phone}`).join(",");

  useEffect(() => {
    let alive = true;
    const load = () =>
      trackEnquiries(useMyEnquiries.getState().refs)
        .then((list) => {
          if (!alive) return;
          setEnquiries(list);
          setError(null);
        })
        .catch((e: Error) => alive && setError(e.message));

    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    const timer = setInterval(onVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    // Demo mode: the admin page in another tab writes to the same localStorage
    window.addEventListener("storage", load);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", load);
    };
  }, [key]);

  return { enquiries: enquiries ?? [], loading: enquiries === null && !error, error };
}
