import React, { Suspense } from "react";
import { NoteListSkeleton, NoteDetailSkeleton } from "./ui/LoadingSkeleton";

// Lazy load heavy components
const NotesPage = React.lazy(() => import("../pages/NotesPage"));
const CreateNoteForm = React.lazy(() => import("./notes/CreateNoteForm"));
const EditNoteForm = React.lazy(() => import("./notes/EditNoteForm"));

// Wrapper components with loading states
export const LazyNotesPage: React.FC = () => (
  <Suspense fallback={<NoteListSkeleton />}>
    <NotesPage />
  </Suspense>
);

export const LazyCreateNoteForm: React.FC<any> = (props) => (
  <Suspense
    fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }
  >
    <CreateNoteForm {...props} />
  </Suspense>
);

export const LazyEditNoteForm: React.FC<any> = (props) => (
  <Suspense
    fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }
  >
    <EditNoteForm {...props} />
  </Suspense>
);
