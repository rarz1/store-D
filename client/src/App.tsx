import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import AuthGuard from "./components/AuthGuard";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGarmentForm from "./pages/admin/AdminGarmentForm";
import AdminDesigns from "./pages/admin/AdminDesigns";
import "./App.css";

export default function App() {
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
