import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import type { Note } from "../../types/note";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search notes...",
  className = "",
  showSuggestions = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  const debouncedValue = useDebounce(value, 300);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!showSuggestions) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/notes/search?q=${encodeURIComponent(query)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuggestions(data.data.suggestions || []);
            setRecentNotes(data.data.notes || []);
          }
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [showSuggestions]
  );

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (debouncedValue && debouncedValue.trim().length >= 2) {
      fetchSuggestions(debouncedValue.trim());
    } else {
      setSuggestions([]);
      setRecentNotes([]);
    }
  }, [debouncedValue, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    setIsOpen(false);
  };

  const handleNoteClick = (note: Note) => {
    onChange(note.title);
    onSearch(note.title);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange("");
    onSearch("");
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
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

  const shouldShowSuggestions =
    isOpen &&
    showSuggestions &&
    (value.length >= 2 || suggestions.length > 0 || recentNotes.length > 0);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {shouldShowSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <span className="mt-2 text-sm">Searching...</span>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {highlightMatch(suggestion, value)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Notes */}
              {recentNotes.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Matching Notes
                  </div>
                  {recentNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {highlightMatch(note.title, value)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {highlightMatch(note.excerpt, value)}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: note.category.color }}
                            />
                            <span className="text-xs text-gray-500">
                              {note.category.name}
                            </span>
                            {note.tags.length > 0 && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {note.tags
                                    .slice(0, 2)
                                    .map((tag) => tag.name)
                                    .join(", ")}
                                  {note.tags.length > 2 &&
                                    ` +${note.tags.length - 2}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isLoading &&
                suggestions.length === 0 &&
                recentNotes.length === 0 &&
                value.length >= 2 && (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No results found for "{value}"</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
