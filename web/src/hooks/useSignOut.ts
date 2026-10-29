import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useCustomer } from "@/store";

// Leave for the home page first, then sign out. The other way round, a page that needs an
// account (like My orders) would bounce to the sign-in page on the way. flushSync makes the
// router show the home page right away instead of in a background transition.
export function useSignOut() {
  const navigate = useNavigate();
  return useCallback(async () => {
    await navigate("/", { replace: true, flushSync: true });
    useCustomer.getState().signOut();
  }, [navigate]);
}
