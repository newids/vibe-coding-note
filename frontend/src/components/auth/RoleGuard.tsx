import React from "react";
import { useAuth } from "../../contexts/AuthContext";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("OWNER" | "VISITOR")[];
  requireOwner?: boolean;
  requireVisitor?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requireOwner = false,
  requireVisitor = false,
  fallback = null,
  showFallback = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, don't show anything unless showFallback is true
  if (!isAuthenticated) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check role-based access
  let hasAccess = false;

  if (allowedRoles) {
    hasAccess = allowedRoles.includes(user?.role as "OWNER" | "VISITOR");
  } else if (requireOwner) {
    hasAccess = user?.role === "OWNER";
  } else if (requireVisitor) {
    hasAccess = user?.role === "VISITOR" || user?.role === "OWNER"; // Owner has visitor privileges
  } else {
    hasAccess = true; // No specific role requirement
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
};
