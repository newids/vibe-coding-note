import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const getVariantClasses = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded-md";
      case "text":
      default:
        return "rounded";
    }
  };

  const getDefaultSize = () => {
    switch (variant) {
      case "circular":
        return { width: "2rem", height: "2rem" };
      case "rectangular":
        return { width: "100%", height: "1rem" };
      case "text":
      default:
        return { width: "100%", height: "1rem" };
    }
  };

  const defaultSize = getDefaultSize();
  const style = {
    width: width || defaultSize.width,
    height: height || defaultSize.height,
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? "75%" : style.width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const NoteCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="space-y-4">
      {/* Category badge */}
      <Skeleton width="80px" height="20px" variant="rectangular" />

      {/* Title */}
      <Skeleton width="100%" height="24px" variant="text" />

      {/* Content lines */}
      <Skeleton lines={3} variant="text" />

      {/* Tags */}
      <div className="flex space-x-2">
        <Skeleton width="60px" height="20px" variant="rectangular" />
        <Skeleton width="80px" height="20px" variant="rectangular" />
        <Skeleton width="70px" height="20px" variant="rectangular" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          <Skeleton width="32px" height="32px" variant="circular" />
          <Skeleton width="100px" height="16px" variant="text" />
        </div>
        <Skeleton width="60px" height="16px" variant="text" />
      </div>
    </div>
  </div>
);

export const NoteListSkeleton: React.FC<{
  count?: number;
  viewMode?: "grid" | "list";
}> = ({ count = 6, viewMode = "grid" }) => (
  <div
    className={
      viewMode === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 gap-6"
        : "space-y-4"
    }
  >
    {Array.from({ length: count }).map((_, index) => (
      <NoteCardSkeleton key={index} />
    ))}
  </div>
);
