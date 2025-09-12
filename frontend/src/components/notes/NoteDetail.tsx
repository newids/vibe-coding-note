import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Note } from "../../types/note";
import { fetchNote } from "../../lib/api/notes";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from "../../lib/api/comments";
import { useAuth } from "../../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  User,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { CommentList, CommentForm } from "../comments";
import { LikeButton } from "./LikeButton";

interface NoteDetailProps {
  noteId: string;
  onBack?: () => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

export const NoteDetail: React.FC<NoteDetailProps> = ({
  noteId,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Fetch note query
  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => fetchNote(noteId),
  });

  // Fetch comments query
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", noteId],
    queryFn: () => fetchComments(noteId),
    enabled: !!noteId,
  });

  // Comment mutations
  const createCommentMutation = useMutation({
    mutationFn: ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => createComment(noteId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
      setShowCommentForm(false);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
  });

  const handleEdit = () => {
    if (note) {
      onEdit?.(note);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      onDelete?.(noteId);
    }
  };

  // Comment handlers
  const handleCommentCreate = async (content: string) => {
    await createCommentMutation.mutateAsync({ content });
  };

  const handleCommentUpdate = async (commentId: string, content: string) => {
    await updateCommentMutation.mutateAsync({ commentId, content });
  };

  const handleCommentDelete = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync(commentId);
  };

  const handleReplyCreate = async (parentId: string, content: string) => {
    await createCommentMutation.mutateAsync({ content, parentId });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">Failed to load note</p>
        <button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = user?.role === "OWNER";

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Badge */}
      <div className="mb-4">
        <span
          className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white"
          style={{ backgroundColor: note.category.color }}
        >
          {note.category.name}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{note.title}</h1>

      {/* Meta Information */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{note.author.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDistanceToNow(new Date(note.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Comments */}
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length}</span>
          </div>

          {/* Likes */}
          <LikeButton noteId={note.id} initialLikeCount={note.likeCount} />
        </div>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        <div
          dangerouslySetInnerHTML={{
            __html: note.content.replace(/\n/g, "<br>"),
          }}
          className="whitespace-pre-wrap"
        />
      </div>

      {/* Comments Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Comments ({comments.length})
          </h3>

          {user && (
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCommentForm ? "Cancel" : "Add Comment"}
            </button>
          )}
        </div>

        {/* Comment Form */}
        {showCommentForm && user && (
          <div className="mb-8">
            <CommentForm
              onSubmit={handleCommentCreate}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : (
          <CommentList
            comments={comments}
            noteId={noteId}
            onCommentUpdate={handleCommentUpdate}
            onCommentDelete={handleCommentDelete}
            onReplyCreate={handleReplyCreate}
          />
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">
              Please log in to leave a comment or reply to existing comments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
