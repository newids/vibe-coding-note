import React from "react";
import { Tag as TagIcon } from "lucide-react";
import type { Tag } from "../../types/note";

interface TagCloudProps {
  tags: Tag[];
  selectedTagIds?: string[];
  onTagClick?: (tag: Tag) => void;
  maxTags?: number;
  showCounts?: boolean;
  className?: string;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  selectedTagIds = [],
  onTagClick,
  maxTags = 20,
  showCounts = true,
  className = "",
}) => {
  // Sort tags by note count and limit
  const sortedTags = tags
    .filter((tag) => (tag.noteCount || 0) > 0)
    .sort((a, b) => (b.noteCount || 0) - (a.noteCount || 0))
    .slice(0, maxTags);

  if (sortedTags.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <TagIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No tags available</p>
      </div>
    );
  }

  // Calculate font sizes based on note count
  const maxCount = Math.max(...sortedTags.map((tag) => tag.noteCount || 0));
  const minCount = Math.min(...sortedTags.map((tag) => tag.noteCount || 0));
  const countRange = maxCount - minCount || 1;

  const getFontSize = (count: number) => {
    const normalized = (count - minCount) / countRange;
    const minSize = 0.75; // text-xs
    const maxSize = 1.5; // text-xl
    return minSize + normalized * (maxSize - minSize);
  };

  const getOpacity = (count: number) => {
    const normalized = (count - minCount) / countRange;
    return 0.6 + normalized * 0.4; // 0.6 to 1.0
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          const fontSize = getFontSize(tag.noteCount || 0);
          const opacity = getOpacity(tag.noteCount || 0);

          return (
            <button
              key={tag.id}
              onClick={() => onTagClick?.(tag)}
              disabled={!onTagClick}
              className={`
                                inline-flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200
                                ${
                                  isSelected
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }
                                ${
                                  onTagClick
                                    ? "cursor-pointer hover:shadow-sm"
                                    : "cursor-default"
                                }
                            `}
              style={{
                fontSize: `${fontSize}rem`,
                opacity: isSelected ? 1 : opacity,
              }}
            >
              <TagIcon className="w-3 h-3" />
              <span>{tag.name}</span>
              {showCounts &&
                tag.noteCount !== undefined &&
                tag.noteCount > 0 && (
                  <span
                    className={`
                                    text-xs px-1 rounded-full
                                    ${
                                      isSelected
                                        ? "bg-blue-400 text-blue-100"
                                        : "bg-gray-300 text-gray-600"
                                    }
                                `}
                  >
                    {tag.noteCount}
                  </span>
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
