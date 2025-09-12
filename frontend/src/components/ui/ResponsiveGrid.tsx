import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = "",
}) => {
  const getGridClasses = () => {
    const classes = ["grid"];

    // Add column classes
    if (columns.sm) classes.push(`grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

    // Add gap class
    classes.push(`gap-${gap}`);

    return classes.join(" ");
  };

  return <div className={`${getGridClasses()} ${className}`}>{children}</div>;
};
