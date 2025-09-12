import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Note, NotesFilters } from "../../types/note";
import { fetchNotes, fetchFilterOptions } from "../../lib/api/notes";
import { NoteCard } from "./NoteCard";
import { FilterPanel } from "../filters/FilterPanel";
import { TagCloud } from "../tags/TagCloud";
import { CategoryNavigation } from "../categories/CategoryNavigation";
import { SearchBar, SearchResults } from "../search";
import { Grid, List } from "lucide-react";
import { Pagination } from "../ui/Pagination";
import { NoteListSkeleton } from "../ui/Skeleton";

interface NoteListProps {
  filters?: NotesFilters;
  onNoteClick?: (note: Note) => void;
  showFilters?: boolean;
  showTagCloud?: boolean;
  showCategoryNav?: boolean;
  showSearchResults?: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({
  filters = {},
  onNoteClick,
  showFilters = true,
  showTagCloud = true,
  showCategoryNav = true,
  showSearchResults = false,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFilters, setCurrentFilters] = useState<NotesFilters>(filters);
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  // Fetch filter options (categories and tags with counts)
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
  });

  const categories = filterOptions?.categories || [];
  const tags = filterOptions?.tags || [];

  // Fetch notes query
  const {
    data: notesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notes", currentFilters],
    queryFn: () => fetchNotes(currentFilters),
  });

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setCurrentFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = (page: number) => {
    setCurrentFilters((prev) => ({ ...prev, page }));
  };

  const handleCategoryChange = (categoryId?: string) => {
    setCurrentFilters((prev) => ({ ...prev, categoryId, page: 1 }));
  };

  const handleTagsChange = (tagIds: string[]) => {
    setCurrentFilters((prev) => ({
      ...prev,
      tagIds: tagIds.length > 0 ? tagIds.join(",") : undefined,
      page: 1,
    }));
  };

  const handleTagClick = (tag: { id: string; name: string }) => {
    const currentTagIds = currentFilters.tagIds
      ? currentFilters.tagIds.split(",")
      : [];
    const isSelected = currentTagIds.includes(tag.id);

    if (isSelected) {
      handleTagsChange(currentTagIds.filter((id) => id !== tag.id));
    } else {
      handleTagsChange([...currentTagIds, tag.id]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCurrentFilters({ page: 1 });
  };

  // Parse selected tag IDs from filters
  const selectedTagIds = currentFilters.tagIds
    ? currentFilters.tagIds.split(",")
    : [];

  if (isLoading) {
    return <NoteListSkeleton count={6} viewMode={viewMode} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load notes</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show search results if we have a search query
  if (showSearchResults && currentFilters.search) {
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearchQueryChange}
          onSearch={handleSearch}
          placeholder="Search notes, titles, and content..."
          showSuggestions={true}
        />

        {/* Search Results */}
        <SearchResults
          query={currentFilters.search}
          notes={notesData?.notes || []}
          totalFound={notesData?.pagination.totalCount || 0}
          isLoading={isLoading}
          onNoteClick={onNoteClick}
        />
      </div>
    );
  }

  if (!notesData?.notes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No notes found</p>
        {currentFilters.search && (
          <button
            onClick={handleClearFilters}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      {showCategoryNav && categories.length > 0 && (
        <CategoryNavigation
          categories={categories}
          selectedCategoryId={currentFilters.categoryId}
          onCategoryClick={(category) => handleCategoryChange(category?.id)}
          showCounts={true}
          layout="horizontal"
          className="mb-6"
        />
      )}

      {/* Tag Cloud */}
      {showTagCloud && tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Popular Tags
          </h3>
          <TagCloud
            tags={tags}
            selectedTagIds={selectedTagIds}
            onTagClick={handleTagClick}
            maxTags={15}
            showCounts={true}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <FilterPanel
              categories={categories}
              tags={tags}
              selectedCategoryId={currentFilters.categoryId}
              selectedTagIds={selectedTagIds}
              onCategoryChange={handleCategoryChange}
              onTagsChange={handleTagsChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Header with search and view toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchQueryChange}
                onSearch={handleSearch}
                placeholder="Search notes..."
                showSuggestions={true}
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes Grid/List */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                : "space-y-4"
            }
          >
            {notesData.notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={onNoteClick}
                variant={viewMode === "list" ? "horizontal" : "vertical"}
              />
            ))}
          </div>

          {/* Pagination */}
          {notesData.pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={notesData.pagination.page}
                totalPages={notesData.pagination.totalPages}
                onPageChange={handlePageChange}
                hasNext={notesData.pagination.hasNext}
                hasPrev={notesData.pagination.hasPrev}
                className="justify-center"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
