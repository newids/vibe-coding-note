import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NoteList, NoteDetail, NoteEditor } from "../components/notes";
import { Layout } from "../components/layout";
import type { Note } from "../types/note";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNote } from "../lib/api/notes";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<"list" | "detail" | "editor">(
    "list"
  );
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const queryClient = useQueryClient();

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setCurrentView("list");
      setSelectedNote(null);
    },
    onError: (error) => {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    },
  });

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedNote(null);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setCurrentView("editor");
  };

  const handleDeleteNote = (noteId: string) => {
    deleteMutation.mutate(noteId);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setCurrentView("editor");
  };

  const handleCloseEditor = () => {
    setCurrentView(selectedNote ? "detail" : "list");
    setEditingNote(null);
  };

  const isOwner = user?.role === "OWNER";

  return (
    <Layout
      onCreateNote={
        isOwner && currentView === "list" ? handleCreateNote : undefined
      }
      className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
    >
      <div className="px-4 py-6 sm:px-0">
        {currentView === "list" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Vibe Coding Notes
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Discover and share knowledge about coding tools and technologies
              </p>

              {/* Hero Search */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for coding tools, frameworks, libraries..."
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const query = (e.target as HTMLInputElement).value;
                        if (query.trim()) {
                          window.location.href = `/search?q=${encodeURIComponent(
                            query.trim()
                          )}`;
                        }
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder*="Search for coding tools"]'
                        ) as HTMLInputElement;
                        const query = input?.value;
                        if (query?.trim()) {
                          window.location.href = `/search?q=${encodeURIComponent(
                            query.trim()
                          )}`;
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching for "React", "Node.js", "Docker", or any coding
                  tool
                </p>
              </div>
            </div>

            <NoteList onNoteClick={handleNoteClick} />
          </div>
        )}

        {currentView === "detail" && selectedNote && (
          <NoteDetail
            noteId={selectedNote.id}
            onBack={handleBackToList}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
        )}

        {currentView === "editor" && (
          <NoteEditor
            note={editingNote || undefined}
            onClose={handleCloseEditor}
            onSave={() => {
              // After saving, go back to the appropriate view
              if (editingNote) {
                // If we were editing, go back to detail view
                setCurrentView("detail");
              } else {
                // If we were creating, go back to list view
                setCurrentView("list");
              }
            }}
          />
        )}

        {!isAuthenticated && currentView === "list" && (
          <div className="text-center mt-12">
            <div className="bg-white shadow rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Join the Community
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to leave comments and interact with the community.
              </p>
              <a
                href="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
