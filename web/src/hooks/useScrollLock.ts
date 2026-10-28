import { useEffect } from "react";

// Counted, so a sheet opened over the drawer doesn't unlock the page when it closes
let locks = 0;

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = "";
    };
  }, [active]);
}
