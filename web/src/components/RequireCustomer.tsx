import { Navigate, Outlet, useLocation } from "react-router";

import { isSignedIn, useCustomer } from "@/store";

// Pages that belong to an account send visitors to sign in, then back here
export function RequireCustomer() {
  const signedIn = useCustomer(isSignedIn);
  const location = useLocation();
  if (!signedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
