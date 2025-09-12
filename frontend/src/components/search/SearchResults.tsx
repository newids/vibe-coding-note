import React from "react";
import { Search, FileText, Calendar, Heart, MessageCircle } from "lucide-react";
import type { Note } from "../../types/note";

interface SearchResultsProps {
  query: string;
  notes: Note[];
  totalFound: number;
  isLoading?: boolean;
  onNoteClick?: (note: Note) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  notes,
  totalFound,
  isLoading = false,
  onNoteClick,
}) => {
  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Searching for "{query}"...</span>
        </div>

        {/* Loading skeleton */}
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Notes</h3>
        <p className="text-gray-500">
          Enter keywords to search through notes, titles, and content
        </p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Results Found
        </h3>
        <p className="text-gray-500 mb-4">No notes found for "{query}"</p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>Try:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Different keywords</li>
            <li>Checking your spelling</li>
            <li>Using more general terms</li>
            <li>Searching for specific tools or technologies</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Search Results</h2>
        </div>
        <div className="text-sm text-gray-500">
          {totalFound} result{totalFound !== 1 ? "s" : ""} for "{query}"
        </div>
      </div>

      {/* Search Results List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onNoteClick?.(note)}
          >
            {/* Note Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {highlightMatch(note.title, query)}
              </h3>
              <div className="flex items-center gap-2 ml-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: note.category.color }}
                />
                <span className="text-sm text-gray-500">
                  {note.category.name}
                </span>
              </div>
            </div>

            {/* Note Excerpt */}
            <p className="text-gray-600 mb-4 line-clamp-3">
              {highlightMatch(note.excerpt, query)}
            </p>

            {/* Note Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                  >
                    {highlightMatch(tag.name, query)}
                  </span>
                ))}
              </div>
            )}

            {/* Note Metadata */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(note.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>
                  {note.likeCount} like{note.likeCount !== 1 ? "s" : ""}
                </span>
              </div>

              {note.commentCount !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {note.commentCount} comment
                    {note.commentCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>by {note.author.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Hint */}
      {totalFound > notes.length && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {notes.length} of {totalFound} results
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Use more specific keywords to narrow down results
          </p>
        </div>
      )}
    </div>
  );
};
