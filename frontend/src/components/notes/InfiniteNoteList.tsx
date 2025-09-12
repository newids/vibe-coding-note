import React, { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Note, NotesFilters } from "../../types/note";
import { fetchNotes } from "../../lib/api/notes";
import { NoteCard } from "./NoteCard";
import { NoteListSkeleton, ResponsiveGrid } from "../ui";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Grid, List, Loader2 } from "lucide-react";

interface InfiniteNoteListProps {
  filters?: NotesFilters;
  onNoteClick?: (note: Note) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  showViewToggle?: boolean;
  className?: string;
}

export const InfiniteNoteList: React.FC<InfiniteNoteListProps> = ({
  filters = {},
  onNoteClick,
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  className = "",
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setCurrentViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Infinite query for notes
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["infinite-notes", filters],
    queryFn: ({ pageParam = 1 }) => fetchNotes({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all notes from all pages
  const allNotes = useMemo(() => {
    return data?.pages.flatMap((page) => page.notes) ?? [];
  }, [data]);

  // Get total count from first page
  const totalCount = data?.pages[0]?.pagination.totalCount ?? 0;

  // Infinite scroll hook
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: !isLoading && !isError,
  });

  if (isLoading) {
    return (
      <div className={className}>
        {showViewToggle && (
          <div className="flex justify-end mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        )}
        <NoteListSkeleton count={6} viewMode={currentViewMode} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">
          {error instanceof Error ? error.message : "Failed to load notes"}
        </p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (allNotes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 mb-4">No notes found</p>
        {(filters.search || filters.categoryId || filters.tagIds) && (
          <p className="text-sm text-gray-400">
            Try adjusting your search criteria or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with view toggle and count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          {totalCount} {totalCount === 1 ? "note" : "notes"} found
        </p>

        {showViewToggle && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-2 rounded-md transition-colors ${
                currentViewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-2 rounded-md transition-colors ${
                currentViewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Notes Grid/List */}
      {currentViewMode === "grid" ? (
        <ResponsiveGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
          {allNotes.map((note, index) => (
            <NoteCard
              key={`${note.id}-${index}`}
              note={note}
              onClick={onNoteClick}
              variant="vertical"
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <div className="space-y-4">
          {allNotes.map((note, index) => (
            <NoteCard
              key={`${note.id}-${index}`}
              note={note}
              onClick={onNoteClick}
              variant="horizontal"
            />
          ))}
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="mt-8">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading more notes...</span>
          </div>
        )}

        {!hasNextPage && allNotes.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              You've reached the end! No more notes to load.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
