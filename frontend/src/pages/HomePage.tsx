import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome to Vibe Coding Notes
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-4">
            This is your personal coding notes application. Here you can:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Create and organize your coding notes</li>
            <li>Categorize notes by technology or topic</li>
            <li>Add tags for better organization</li>
            <li>Access your notes from anywhere</li>
          </ul>

          {!user ? (
            <div className="flex space-x-4">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started - Sign Up
              </Link>
              <Link
                to="/login"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Already have an account? Sign In
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-green-600 mb-4">
                Welcome back, {user.name}! Ready to manage your notes?
              </p>
              <Link
                to="/notes"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to My Notes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
