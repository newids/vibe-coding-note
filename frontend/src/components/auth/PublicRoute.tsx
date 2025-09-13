import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user } = useAuth();

  // Redirect to notes if already authenticated
  if (user) {
    return <Navigate to="/notes" replace />;
  }

  // Render public content if not authenticated
  return <>{children}</>;
};

export default PublicRoute;
