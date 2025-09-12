import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  showFirstLast = true,
  maxVisiblePages = 7,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      const startPage = Math.max(
        2,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className={`flex items-center justify-center space-x-1 ${className}`}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </button>

      {/* First Page (if not in visible range) */}
      {showFirstLast &&
        currentPage > Math.ceil(maxVisiblePages / 2) + 1 &&
        totalPages > maxVisiblePages && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {currentPage > Math.ceil(maxVisiblePages / 2) + 2 && (
              <span className="px-3 py-2 text-sm font-medium text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )}
          </>
        )}

      {/* Page Numbers */}
      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === "ellipsis" ? (
            <span className="px-3 py-2 text-sm font-medium text-gray-500">
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${
                page === currentPage
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Last Page (if not in visible range) */}
      {showFirstLast &&
        currentPage < totalPages - Math.floor(maxVisiblePages / 2) &&
        totalPages > maxVisiblePages && (
          <>
            {currentPage < totalPages - Math.floor(maxVisiblePages / 2) - 1 && (
              <span className="px-3 py-2 text-sm font-medium text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        aria-label="Next page"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
