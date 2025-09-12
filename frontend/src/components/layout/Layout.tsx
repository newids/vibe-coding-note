import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  onCreateNote?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onCreateNote,
  showHeader = true,
  showFooter = true,
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header onCreateNote={onCreateNote} />}

      <main className={`flex-1 ${className}`}>{children}</main>

      {showFooter && <Footer />}
    </div>
  );
};
