import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../../test/utils";
import CommentForm from "../CommentForm";

// Mock the API call
const mockCreateComment = vi.fn();
vi.mock("../../../lib/api/comments", () => ({
  createComment: mockCreateComment,
}));

// Mock the auth context
const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "VISITOR" as const,
};

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

describe("CommentForm", () => {
  const defaultProps = {
    noteId: "test-note-id",
    onCommentAdded: vi.fn(),
  };

  beforeEach(() => {
    mockCreateComment.mockClear();
    defaultProps.onCommentAdded.mockClear();
    mockCreateComment.mockResolvedValue({
      id: "new-comment-id",
      content: "New comment",
      authorId: mockUser.id,
      noteId: defaultProps.noteId,
      createdAt: new Date().toISOString(),
      author: mockUser,
    });
  });

  it("renders comment form with textarea and submit button", () => {
    render(<CommentForm {...defaultProps} />);

    expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /post comment/i })
    ).toBeInTheDocument();
  });

  it("shows user avatar and name", () => {
    render(<CommentForm {...defaultProps} />);

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    // Assuming there's an avatar component or image
    expect(screen.getByAltText(/avatar/i)).toBeInTheDocument();
  });

  it("disables submit button when textarea is empty", () => {
    render(<CommentForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /post comment/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when textarea has content", async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");

    expect(submitButton).not.toBeDisabled();
  });

  it("submits comment with correct data", async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");
    await user.click(submitButton);

    expect(mockCreateComment).toHaveBeenCalledWith(defaultProps.noteId, {
      content: "This is a test comment",
    });
  });

  it("calls onCommentAdded after successful submission", async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onCommentAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-comment-id",
          content: "New comment",
        })
      );
    });
  });

  it("clears textarea after successful submission", async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    // Make the API call take some time
    mockCreateComment.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: "new-comment-id",
                content: "New comment",
                authorId: mockUser.id,
                noteId: defaultProps.noteId,
                createdAt: new Date().toISOString(),
                author: mockUser,
              }),
            100
          )
        )
    );

    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");
    await user.click(submitButton);

    expect(screen.getByRole("button", { name: /posting/i })).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /post comment/i })
      ).not.toBeDisabled();
    });
  });

  it("handles submission error gracefully", async () => {
    const user = userEvent.setup();
    mockCreateComment.mockRejectedValue(new Error("Network error"));

    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    await user.type(textarea, "This is a test comment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error posting comment/i)).toBeInTheDocument();
    });

    // Textarea should retain content on error
    expect(textarea).toHaveValue("This is a test comment");
  });

  it("shows login prompt for unauthenticated users", () => {
    // Mock unauthenticated state
    vi.mocked(vi.importActual("../../../contexts/AuthContext")).useAuth =
      () => ({
        user: null,
        isAuthenticated: false,
      });

    render(<CommentForm {...defaultProps} />);

    expect(screen.getByText(/sign in to comment/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/write a comment/i)
    ).not.toBeInTheDocument();
  });

  it("validates comment length", async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    const submitButton = screen.getByRole("button", { name: /post comment/i });

    // Test minimum length
    await user.type(textarea, "a");
    expect(submitButton).toBeDisabled();

    // Test maximum length (assuming there's a limit)
    const longComment = "a".repeat(1001); // Assuming 1000 char limit
    await user.clear(textarea);
    await user.type(textarea, longComment);

    expect(screen.getByText(/comment too long/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
