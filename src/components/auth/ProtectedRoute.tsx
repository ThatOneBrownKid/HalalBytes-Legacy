import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "moderator" | "user";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Check role-based access
  // Note: All data operations in admin pages are protected by RLS policies
  // using the has_role() function in the database. This client-side check
  // is only for UX - the real security is enforced at the database level.
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    };

    const userLevel = role ? roleHierarchy[role] || 0 : 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      // User doesn't have sufficient permissions
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
