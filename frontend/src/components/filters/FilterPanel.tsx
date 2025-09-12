import React, { useState } from "react";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  Folder,
} from "lucide-react";
import type { Category, Tag } from "../../types/note";

interface FilterPanelProps {
  categories: Category[];
  tags: Tag[];
  selectedCategoryId?: string;
  selectedTagIds: string[];
  onCategoryChange: (categoryId?: string) => void;
  onTagsChange: (tagIds: string[]) => void;
  onClearFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  tags,
  selectedCategoryId,
  selectedTagIds,
  onCategoryChange,
  onTagsChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const hasActiveFilters = selectedCategoryId || selectedTagIds.length > 0;

  // Show top categories by note count
  const topCategories = categories
    .filter((cat) => (cat.noteCount || 0) > 0)
    .sort((a, b) => (b.noteCount || 0) - (a.noteCount || 0))
    .slice(0, showAllCategories ? undefined : 5);

  // Show top tags by note count
  const topTags = tags
    .filter((tag) => (tag.noteCount || 0) > 0)
    .sort((a, b) => (b.noteCount || 0) - (a.noteCount || 0))
    .slice(0, showAllTags ? undefined : 10);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {(selectedCategoryId ? 1 : 0) + selectedTagIds.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                {selectedCategory.name}
                <button
                  onClick={() => onCategoryChange(undefined)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
              >
                <TagIcon className="w-3 h-3" />
                {tag.name}
                <button
                  onClick={() => handleTagToggle(tag.id)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Folder className="w-4 h-4" />
              Categories
            </h4>
            <div className="space-y-2">
              {/* All Categories Option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategoryId}
                  onChange={() => onCategoryChange(undefined)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">All Categories</span>
              </label>

              {/* Category Options */}
              {topCategories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategoryId === category.id}
                    onChange={() => onCategoryChange(category.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                  {category.noteCount !== undefined &&
                    category.noteCount > 0 && (
                      <span className="text-xs text-gray-500">
                        ({category.noteCount})
                      </span>
                    )}
                </label>
              ))}

              {/* Show More Categories */}
              {categories.length > 5 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More ({categories.length - 5} more)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <TagIcon className="w-4 h-4" />
              Tags
            </h4>
            <div className="space-y-2">
              {topTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <TagIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                  {tag.noteCount !== undefined && tag.noteCount > 0 && (
                    <span className="text-xs text-gray-500">
                      ({tag.noteCount})
                    </span>
                  )}
                </label>
              ))}

              {/* Show More Tags */}
              {tags.length > 10 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showAllTags ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More ({tags.length - 10} more)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
