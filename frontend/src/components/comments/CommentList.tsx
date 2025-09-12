import React from "react";
import type { Comment } from "../../types/note";
import CommentItem from "./CommentItem";

interface CommentListProps {
  comments: Comment[];
  noteId: string;
  onCommentUpdate: (commentId: string, content: string) => Promise<void>;
  onCommentDelete: (commentId: string) => Promise<void>;
  onReplyCreate: (parentId: string, content: string) => Promise<void>;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  noteId,
  onCommentUpdate,
  onCommentDelete,
  onReplyCreate,
}) => {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          noteId={noteId}
          onUpdate={onCommentUpdate}
          onDelete={onCommentDelete}
          onReplyCreate={onReplyCreate}
        />
      ))}
    </div>
  );
};

export default CommentList;
