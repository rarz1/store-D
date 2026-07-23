import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import AuthGuard from "./components/AuthGuard";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGarmentForm from "./pages/admin/AdminGarmentForm";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminSettings from "./pages/admin/AdminSettings";
import { getSettings, applyColors, type SiteSettings } from "./lib/settings";
import "./App.css";

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
    <BrowserRouter>
      <AuthProvider>
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
            path="/admin/designs/:id"
            element={<AuthGuard><AdminDesigns /></AuthGuard>}
          />
          <Route
            path="/admin/settings"
            element={<AuthGuard><AdminSettings /></AuthGuard>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
