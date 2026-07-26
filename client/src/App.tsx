import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { ToastProvider } from "./lib/toast";
import AuthGuard from "./components/AuthGuard";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGarmentForm from "./pages/admin/AdminGarmentForm";
import AdminDesigns from "./pages/admin/AdminDesigns";
import { getSettings, applyColors, type SiteSettings } from "./lib/settings";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  },
});

export default function App() {
  const [, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        applyColors(s);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/producto/:garmentId" element={<ProductPage />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={<AuthGuard><AdminDashboard /></AuthGuard>}
              />
              <Route
                path="/admin/garments/:id/edit"
                element={<AuthGuard><AdminGarmentForm /></AuthGuard>}
              />
              <Route
                path="/admin/garments/:id"
                element={<AuthGuard><AdminGarmentForm /></AuthGuard>}
              />
              <Route
                path="/admin/designs/:id/edit"
                element={<AuthGuard><AdminDesigns /></AuthGuard>}
              />
              <Route
                path="/admin/designs/:id"
                element={<AuthGuard><AdminDesigns /></AuthGuard>}
              />
            </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
