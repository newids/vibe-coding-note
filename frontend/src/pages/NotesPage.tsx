import React, { useState, useEffect, useCallback } from "react";
import NoteCard from "../components/notes/NoteCard";
import CreateNoteForm from "../components/notes/CreateNoteForm";
import EditNoteForm from "../components/notes/EditNoteForm";
import SearchBar from "../components/notes/SearchBar";
import Pagination from "../components/ui/Pagination";
import {
  NoteListSkeleton,
  SearchBarSkeleton,
  NoteDetailSkeleton,
} from "../components/ui/LoadingSkeleton";
import { apiClient } from "../lib/api";

// Define Note interface directly here
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes and categories from API
  const fetchNotes = useCallback(async (search?: string, category?: string) => {
    try {
      setIsLoading(true);
      const params: { search?: string; category?: string } = {};
      if (search) params.search = search;
      if (category && category !== "all") params.category = category;

      const fetchedNotes = await apiClient.getNotes(params);
      setNotes(fetchedNotes as Note[]);
    } catch (err) {
      setError("Failed to load notes");
      console.error("Error fetching notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [fetchedNotes, fetchedCategories] = await Promise.all([
          apiClient.getNotes(),
          apiClient.getCategories(),
        ]);
        setNotes(fetchedNotes as Note[]);
        setAllNotes(fetchedNotes as Note[]);
        setCategories(fetchedCategories as string[]);
      } catch (err) {
        setError("Failed to load data");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch notes when search or category changes
  useEffect(() => {
    if (!isLoading) {
      fetchNotes(searchTerm, selectedCategory);
    }
  }, [searchTerm, selectedCategory, fetchNotes, isLoading]);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  const handleBackToList = () => {
    setSelectedNote(null);
  };

  const handleCreateNote = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleNoteCreated = (newNote: Note) => {
    setAllNotes((prevNotes) => [newNote, ...prevNotes]);
    setCategories((prevCategories) => {
      if (!prevCategories.includes(newNote.category)) {
        return [...prevCategories, newNote.category];
      }
      return prevCategories;
    });
    // Refresh the filtered view
    fetchNotes(searchTerm, selectedCategory);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setSelectedNote(null);
  };

  const handleCloseEditForm = () => {
    setEditingNote(null);
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setAllNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
    setCategories((prevCategories) => {
      if (!prevCategories.includes(updatedNote.category)) {
        return [...prevCategories, updatedNote.category];
      }
      return prevCategories;
    });
    // If we're viewing this note, update the selected note too
    if (selectedNote && selectedNote.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
    // Refresh the filtered view
    fetchNotes(searchTerm, selectedCategory);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await apiClient.deleteNote(noteId);
        setAllNotes((prevNotes) =>
          prevNotes.filter((note) => note.id !== noteId)
        );
        // If we're viewing this note, go back to list
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(null);
        }
        // Refresh the filtered view
        fetchNotes(searchTerm, selectedCategory);
      } catch (err) {
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading notes...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Show individual note
  if (selectedNote) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleBackToList}
            className="mb-6 text-blue-600 hover:text-blue-800"
          >
            ← Back to Notes
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedNote.title}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {selectedNote.category}
                </span>
                <button
                  onClick={() => handleEditNote(selectedNote)}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span>
                Created: {new Date(selectedNote.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-gray-700 whitespace-pre-wrap">
              {selectedNote.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show notes list
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Notes ({notes.length})
          </h1>
          <button
            onClick={handleCreateNote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Note
          </button>
        </div>

        <SearchBar
          onSearch={handleSearch}
          onCategoryFilter={handleCategoryFilter}
          categories={categories}
          currentSearch={searchTerm}
          currentCategory={selectedCategory}
        />

        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            {allNotes.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first note to get started!
                </p>
                <button
                  onClick={handleCreateNote}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Note
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notes found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateForm && (
        <CreateNoteForm
          onClose={handleCloseCreateForm}
          onNoteCreated={handleNoteCreated}
        />
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteForm
          note={editingNote}
          onClose={handleCloseEditForm}
          onNoteUpdated={handleNoteUpdated}
        />
      )}
    </div>
  );
};

export default NotesPage;
