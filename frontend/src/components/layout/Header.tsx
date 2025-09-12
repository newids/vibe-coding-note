import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useRole } from "../../hooks/useRole";
import { Plus, Menu, X, Search, Settings, Users } from "lucide-react";

interface HeaderProps {
  onCreateNote?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateNote }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isOwner, canCreateNote, canManageUsers } = useRole();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              onClick={closeMobileMenu}
            >
              Vibe Coding Notes
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isHomePage
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                location.pathname === "/search"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>

            {/* Owner-only navigation items */}
            {canManageUsers() && (
              <>
                <Link
                  to="/admin/users"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === "/admin/users"
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === "/admin/settings"
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {canCreateNote() && onCreateNote && (
                  <button
                    onClick={onCreateNote}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Note</span>
                  </button>
                )}

                <div className="flex items-center space-x-3">
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-center">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Navigation Links */}
              <Link
                to="/"
                className={`text-base font-medium transition-colors ${
                  isHomePage
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                  location.pathname === "/search"
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={closeMobileMenu}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>

              {/* Owner-only mobile navigation items */}
              {canManageUsers() && (
                <>
                  <Link
                    to="/admin/users"
                    className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                      location.pathname === "/admin/users"
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <Users className="w-4 h-4" />
                    <span>Users</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                      location.pathname === "/admin/settings"
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </>
              )}

              {/* User Actions */}
              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    {user?.avatar && (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-gray-700">
                        {user?.name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  {canCreateNote() && onCreateNote && (
                    <button
                      onClick={() => {
                        onCreateNote();
                        closeMobileMenu();
                      }}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full justify-center mb-3"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Note</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="text-base text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/auth"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors block text-center"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
