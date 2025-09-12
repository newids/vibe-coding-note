import React from "react";
import { ChevronDown, Folder } from "lucide-react";
import type { Category } from "../../types/note";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  placeholder = "Select a category",
  disabled = false,
  required = false,
}) => {
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  return (
    <div className="relative">
      <div className="relative">
        <select
          value={selectedCategoryId || ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.noteCount !== undefined &&
                category.noteCount > 0 &&
                ` (${category.noteCount} note${
                  category.noteCount !== 1 ? "s" : ""
                })`}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Selected category preview */}
      {selectedCategory && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedCategory.color }}
          />
          <Folder className="w-4 h-4" />
          <span>{selectedCategory.name}</span>
          {selectedCategory.description && (
            <span className="text-gray-500">
              - {selectedCategory.description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
