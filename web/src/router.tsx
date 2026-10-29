import { createBrowserRouter } from "react-router";

import { SiteLayout } from "@/components/SiteLayout";
import { PageLoading } from "@/components/ui";
import Catalogue from "@/pages/Catalogue";
import Enquiry from "@/pages/Enquiry";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import OrderDetail from "@/pages/OrderDetail";
import Orders from "@/pages/Orders";
import Product from "@/pages/Product";
import ThankYou from "@/pages/ThankYou";

// Admin pages load on demand so shoppers never download them
const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});


export const router = createBrowserRouter([
  {
    Component: SiteLayout,
    children: [
      { index: true, Component: Home },
      { path: "catalogue", Component: Catalogue },
      { path: "product/:id", Component: Product },
      { path: "enquiry", Component: Enquiry },
      { path: "thank-you/:id", Component: ThankYou },
      { path: "orders", Component: Orders },
      { path: "orders/:id", Component: OrderDetail },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "admin/login",
    HydrateFallback: PageLoading,
    lazy: lazyPage(() => import("@/pages/admin/AdminLogin")),
  },
  {
    path: "admin",
    HydrateFallback: PageLoading,
    lazy: lazyPage(() => import("@/pages/admin/RequireAdmin")),
    children: [{ index: true, lazy: lazyPage(() => import("@/pages/admin/AdminDashboard")) }],
  },
]);
