import React from "react";
import type { Note } from "../../types/note";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, User, Calendar, Edit, Trash2 } from "lucide-react";
import { LikeButton } from "./LikeButton";
import { useRole } from "../../hooks/useRole";

interface NoteCardProps {
  note: Note;
  onClick?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  variant?: "vertical" | "horizontal";
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onEdit,
  onDelete,
  variant = "vertical",
}) => {
  const { canEditNote, canDeleteNote } = useRole();

  const handleClick = () => {
    onClick?.(note);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note);
  };

  if (variant === "horizontal") {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="p-4">
          <div className="flex items-start space-x-4">
            {/* Left side - Category and content */}
            <div className="flex-1 min-w-0">
              {/* Category Badge */}
              <span
                className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white mb-2"
                style={{ backgroundColor: note.category.color }}
              >
                {note.category.name}
              </span>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                {note.title}
              </h3>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {note.excerpt}
              </p>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      #{tag.name}
                    </span>
                  ))}
                  {note.tags.length > 4 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                      +{note.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Meta info */}
            <div className="flex flex-col items-end space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="truncate max-w-20">{note.author.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{note.commentCount || 0}</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton
                    noteId={note.id}
                    initialLikeCount={note.likeCount}
                  />
                </div>
                {/* Owner/Author Actions */}
                {(canEditNote(note.author.id) ||
                  canDeleteNote(note.author.id)) && (
                  <div className="flex items-center space-x-1">
                    {canEditNote(note.author.id) && onEdit && (
                      <button
                        onClick={handleEdit}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit note"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteNote(note.author.id) && onDelete && (
                      <button
                        onClick={handleDelete}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vertical variant (default)
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Category Badge */}
      <div className="p-4 pb-2">
        <span
          className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: note.category.color }}
        >
          {note.category.name}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {note.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {note.excerpt}
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                #{tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{note.author.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(note.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Comments */}
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{note.commentCount || 0}</span>
            </div>

            {/* Likes */}
            <div onClick={(e) => e.stopPropagation()}>
              <LikeButton noteId={note.id} initialLikeCount={note.likeCount} />
            </div>

            {/* Owner/Author Actions */}
            {(canEditNote(note.author.id) || canDeleteNote(note.author.id)) && (
              <div className="flex items-center space-x-1">
                {canEditNote(note.author.id) && onEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit note"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDeleteNote(note.author.id) && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
