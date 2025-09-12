import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { NoteList } from "../components/notes/NoteList";
import { Layout } from "../components/layout";
import type { NotesFilters } from "../types/note";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters] = useState<NotesFilters>(() => {
    const search = searchParams.get("q") || "";
    const categoryId = searchParams.get("category") || undefined;
    const tagIds = searchParams.get("tags") || undefined;
    const page = parseInt(searchParams.get("page") || "1");

    return {
      search,
      categoryId,
      tagIds,
      page,
    };
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("q", filters.search);
    if (filters.categoryId) params.set("category", filters.categoryId);
    if (filters.tagIds) params.set("tags", filters.tagIds);
    if (filters.page && filters.page > 1)
      params.set("page", filters.page.toString());

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleNoteClick = (note: any) => {
    navigate(`/notes/${note.id}`);
  };

  return (
    <Layout className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Notes</h1>
        <p className="mt-2 text-gray-600">
          Find coding tools, tips, and experiences shared by the community
        </p>
      </div>

      <NoteList
        filters={filters}
        onNoteClick={handleNoteClick}
        showFilters={true}
        showTagCloud={false}
        showCategoryNav={false}
        showSearchResults={true}
      />
    </Layout>
  );
};
