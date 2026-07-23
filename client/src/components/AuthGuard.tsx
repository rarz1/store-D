import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="admin-page admin-page--loading"><p>Cargando...</p></div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
}
