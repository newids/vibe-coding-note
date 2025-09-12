import React from "react";
import { useRole } from "../../hooks/useRole";
import { RoleGuard } from "../auth/RoleGuard";
import CommentForm from "./CommentForm";

interface CommentFormWrapperProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitText?: string;
  showCancel?: boolean;
}

export const CommentFormWrapper: React.FC<CommentFormWrapperProps> = (
  props
) => {
  const { isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 mb-3">
          You need to be logged in to post comments.
        </p>
        <button
          onClick={() => (window.location.href = "/auth")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <RoleGuard requireVisitor>
      <CommentForm {...props} />
    </RoleGuard>
  );
};
