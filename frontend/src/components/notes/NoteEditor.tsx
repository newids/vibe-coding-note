import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Note, UpdateNoteData, Tag } from "../../types/note";
import { createNote, updateNote, fetchCategories } from "../../lib/api/notes";
import { X, Save, Eye, EyeOff } from "lucide-react";
import { TagSelector } from "../tags/TagSelector";
import { CategorySelector } from "../categories/CategorySelector";
import { useToast } from "../ui/Toast";
import { noteFormSchema, NoteFormData } from "../../lib/validation";
import { ApiErrorHandler } from "../../lib/errors";

interface NoteEditorProps {
  note?: Note; // If provided, we're editing; otherwise, creating
  onClose: () => void;
  onSave?: (note: Note) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onClose,
  onSave,
}) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note?.tags || []);
  const [showPreview, setShowPreview] = useState(false);
  const { showError, showSuccess } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
      categoryId: note?.categoryId || "",
      tags: note?.tags.map((tag) => tag.id) || [],
    },
  });

  const watchedContent = watch("content");

  const queryClient = useQueryClient();
  const isEditing = !!note;

  // Fetch categories and tags
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      onSave?.(newNote);
      onClose();
    },
    onError: (error) => {
      console.error("Failed to create note:", error);
      alert("Failed to create note. Please try again.");
    },
  });

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      updateNote(id, data),
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", note?.id] });
      onSave?.(updatedNote);
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update note:", error);
      alert("Failed to update note. Please try again.");
    },
  });

  const onSubmit = (data: NoteFormData) => {
    const noteData = {
      title: data.title.trim(),
      content: data.content.trim(),
      categoryId: data.categoryId,
      tagIds: selectedTags.map((tag) => tag.id),
      published: data.published || false,
    };

    if (isEditing && note) {
      updateMutation.mutate({ id: note.id, data: noteData });
    } else {
      createMutation.mutate(noteData);
    }
  };

  const handleTagsChange = (tags: Tag[]) => {
    setSelectedTags(tags);
    setValue(
      "tags",
      tags.map((tag) => tag.id)
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Note" : "Create New Note"}
          </h2>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{showPreview ? "Edit" : "Preview"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form
            id="note-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                {...register("title")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter note title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <CategorySelector
                categories={categories}
                selectedCategoryId={watch("categoryId")}
                onCategoryChange={(categoryId) =>
                  setValue("categoryId", categoryId)
                }
                placeholder="Select a category"
                required
              />
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                placeholder="Add tags..."
                canCreateTags={true}
              />
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content *
              </label>

              {showPreview ? (
                <div className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: watchedContent.replace(/\n/g, "<br>"),
                      }}
                      className="whitespace-pre-wrap"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  id="content"
                  {...register("content")}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your note content here..."
                />
              )}
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Published Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                {...register("published")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="published"
                className="ml-2 block text-sm text-gray-700"
              >
                Publish immediately
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="note-form"
            disabled={isLoading || isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>
              {isLoading || isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update"
                : "Create"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
