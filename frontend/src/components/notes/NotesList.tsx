import React from "react";
import { Note } from "../../types/note";
import NoteCard from "./NoteCard";

interface NotesListProps {
  notes: Note[];
  onNoteClick?: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ notes, onNoteClick }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
        <p className="text-gray-600">Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => onNoteClick?.(note)}
        />
      ))}
    </div>
  );
};

export default NotesList;
