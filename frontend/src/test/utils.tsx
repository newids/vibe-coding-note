import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Mock user for testing
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "VISITOR" as const,
};

// Mock note for testing
export const mockNote = {
  id: "note-1",
  title: "Test Note",
  content: "This is test note content",
  excerpt: "Test excerpt",
  slug: "test-note",
  authorId: "test-user-id",
  categoryId: "category-1",
  likeCount: 5,
  published: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  author: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
  },
  category: {
    id: "category-1",
    name: "JavaScript",
    slug: "javascript",
    color: "#F7DF1E",
  },
  tags: [
    {
      id: "tag-1",
      name: "React",
      slug: "react",
    },
  ],
};

// Mock comment for testing
export const mockComment = {
  id: "comment-1",
  content: "Great article!",
  authorId: "visitor-id",
  noteId: "note-1",
  createdAt: "2024-01-01T01:00:00Z",
  author: {
    id: "visitor-id",
    name: "Visitor",
    email: "visitor@example.com",
  },
};
