import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return null;

  const target = `${location.pathname}${location.search}${location.hash}`;
  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: target }} />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace state={{ email: user.email, from: target }} />;
  }

  return children;
}
