import React, { useState } from "react";
import type { Comment } from "../../types/note";
import { useAuth } from "../../contexts/AuthContext";
import { useRole } from "../../hooks/useRole";
import CommentEditor from "./CommentEditor";
import CommentForm from "./CommentForm";

interface CommentItemProps {
  comment: Comment;
  noteId: string;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReplyCreate: (parentId: string, content: string) => Promise<void>;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  noteId,
  onUpdate,
  onDelete,
  onReplyCreate,
  isReply = false,
}) => {
  const { user } = useAuth();
  const { canEditComment, canDeleteComment, canCreateComment } = useRole();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = canEditComment(comment.authorId);
  const canDelete = canDeleteComment(comment.authorId);

  const handleEdit = async (content: string) => {
    try {
      await onUpdate(comment.id, content);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setIsDeleting(false);
    }
  };

  const handleReply = async (content: string) => {
    try {
      await onReplyCreate(comment.id, content);
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to create reply:", error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isDeleting) {
    return (
      <div
        className={`${
          isReply ? "ml-8" : ""
        } p-4 bg-gray-50 rounded-lg opacity-50`}
      >
        <p className="text-gray-500">Deleting comment...</p>
      </div>
    );
  }

  return (
    <div className={`${isReply ? "ml-8" : ""} border-l-2 border-gray-200 pl-4`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {comment.author.name}
                {comment.author.role === "OWNER" && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Owner
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(comment.createdAt)}
                {comment.updatedAt !== comment.createdAt && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex items-center space-x-2">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  disabled={isEditing}
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-800"
                  disabled={isDeleting}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <CommentEditor
            initialContent={comment.content}
            onSave={handleEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="mb-3">
            <p className="text-gray-800 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        )}

        {/* Reply Button */}
        {!isReply && canCreateComment() && !isEditing && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isReplying ? "Cancel Reply" : "Reply"}
            </button>
          </div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              submitText="Reply"
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              noteId={noteId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReplyCreate={onReplyCreate}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
