import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { fetchTagSuggestions, createTag } from "../../lib/api/notes";
import type { Tag } from "../../types/note";

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  disabled?: boolean;
  canCreateTags?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Add tags...",
  disabled = false,
  canCreateTags = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await fetchTagSuggestions(inputValue, 10);
        // Filter out already selected tags
        const filteredResults = results.filter(
          (tag) => !selectedTags.some((selected) => selected.id === tag.id)
        );
        setSuggestions(filteredResults);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedTags]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateTag();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectTag(suggestions[highlightedIndex]);
        } else {
          handleCreateTag();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle tag selection
  const handleSelectTag = (tag: Tag) => {
    if (!selectedTags.some((selected) => selected.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
  };

  // Handle creating new tag
  const handleCreateTag = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !canCreateTags) return;

    // Check if tag already exists in suggestions or selected tags
    const existingTag = suggestions.find(
      (tag) => tag.name.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (existingTag) {
      handleSelectTag(existingTag);
      return;
    }

    if (
      selectedTags.some(
        (tag) => tag.name.toLowerCase() === trimmedValue.toLowerCase()
      )
    ) {
      setInputValue("");
      return;
    }

    try {
      setIsLoading(true);
      const newTag = await createTag(trimmedValue);
      onTagsChange([...selectedTags, newTag]);
      setInputValue("");
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error creating tag:", error);
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              <TagIcon className="w-3 h-3" />
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            suggestions.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                  index === highlightedIndex ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  <span>{tag.name}</span>
                </div>
                {tag.noteCount !== undefined && tag.noteCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {tag.noteCount} note{tag.noteCount !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            ))
          ) : inputValue.trim() && canCreateTags ? (
            <button
              type="button"
              onClick={handleCreateTag}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Create "{inputValue.trim()}"
            </button>
          ) : inputValue.trim() ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No tags found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};
