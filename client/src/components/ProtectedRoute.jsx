
import { useAuth } from "../constext/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Wait until Firebase authentication and profile loading finish
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Verification page must remain accessible
  if (location.pathname === "/verify-id") {
    return children;
  }

  // If profile is unavailable, prevent access to Shuttle features
  if (!profile) {
    return <Navigate to="/verify-id" replace />;
  }

  const verificationStatus =
    profile.verification?.status || "Not Submitted";

  // Only Admin-approved users can access Shuttle features
  if (verificationStatus !== "Approved") {
    return <Navigate to="/verify-id" replace />;
  }

  return children;
}
