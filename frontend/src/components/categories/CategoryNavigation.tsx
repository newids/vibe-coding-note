import React from "react";
import { Folder, Grid } from "lucide-react";
import type { Category } from "../../types/note";

interface CategoryNavigationProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryClick?: (category: Category | null) => void;
  showCounts?: boolean;
  layout?: "horizontal" | "vertical" | "grid";
  className?: string;
}

export const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories,
  selectedCategoryId,
  onCategoryClick,
  showCounts = true,
  layout = "horizontal",
  className = "",
}) => {
  // Sort categories by note count
  const sortedCategories = categories
    .filter((cat) => (cat.noteCount || 0) > 0)
    .sort((a, b) => (b.noteCount || 0) - (a.noteCount || 0));

  if (sortedCategories.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Grid className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No categories available</p>
      </div>
    );
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case "vertical":
        return "flex flex-col space-y-2";
      case "grid":
        return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";
      default:
        return "flex flex-wrap gap-2";
    }
  };

  const getItemClasses = (isSelected: boolean) => {
    const baseClasses = `
            transition-all duration-200 border rounded-lg
            ${
              onCategoryClick
                ? "cursor-pointer hover:shadow-md"
                : "cursor-default"
            }
        `;

    if (layout === "grid") {
      return `${baseClasses} p-4 text-center ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`;
    }

    return `${baseClasses} px-3 py-2 ${
      isSelected
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
    }`;
  };

  return (
    <div className={className}>
      {/* All Categories Option */}
      {onCategoryClick && (
        <div className={getLayoutClasses()}>
          <button
            onClick={() => onCategoryClick(null)}
            className={getItemClasses(!selectedCategoryId)}
          >
            {layout === "grid" ? (
              <div>
                <Grid className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="font-medium">All Categories</div>
                <div className="text-sm text-gray-500 mt-1">View all notes</div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                <span>All Categories</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Category Items */}
      <div className={getLayoutClasses()}>
        {sortedCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick?.(category)}
              disabled={!onCategoryClick}
              className={getItemClasses(isSelected)}
            >
              {layout === "grid" ? (
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="font-medium text-gray-900">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </div>
                  )}
                  {showCounts &&
                    category.noteCount !== undefined &&
                    category.noteCount > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        {category.noteCount} note
                        {category.noteCount !== 1 ? "s" : ""}
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Folder className="w-2 h-2 text-white" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                  {showCounts &&
                    category.noteCount !== undefined &&
                    category.noteCount > 0 && (
                      <span className="text-sm text-gray-500">
                        ({category.noteCount})
                      </span>
                    )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
