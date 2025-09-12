import React from "react";
import { Crown, User } from "lucide-react";

interface RoleBadgeProps {
  role: "OWNER" | "VISITOR";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = "sm",
  showIcon = false,
  className = "",
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const roleClasses = {
    OWNER: "bg-purple-100 text-purple-800",
    VISITOR: "bg-blue-100 text-blue-800",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const Icon = role === "OWNER" ? Crown : User;

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${roleClasses[role]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSize[size]} mr-1`} />}
      {role === "OWNER" ? "Owner" : "Visitor"}
    </span>
  );
};
