import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { createQueryClient } from "./lib/query-client";

// Lazy load pages for code splitting
const HomePage = React.lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage }))
);
const AuthPage = React.lazy(() =>
  import("./pages/AuthPage").then((module) => ({ default: module.AuthPage }))
);
const SearchPage = React.lazy(() =>
  import("./pages/SearchPage").then((module) => ({
    default: module.SearchPage,
  }))
);

// Loading component for lazy-loaded routes
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

// Create optimized query client
const queryClient = createQueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route
                    path="/auth/callback"
                    element={<AuthCallbackHandler />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Component to handle OAuth callback
const AuthCallbackHandler: React.FC = () => {
  React.useEffect(() => {
    // The AuthProvider will handle the token from URL params
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default App;
