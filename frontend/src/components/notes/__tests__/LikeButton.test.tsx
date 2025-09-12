import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../../test/utils";
import LikeButton from "../LikeButton";

// Mock the API call
const mockLikeNote = vi.fn();
vi.mock("../../../lib/api/notes", () => ({
  likeNote: mockLikeNote,
}));

describe("LikeButton", () => {
  const defaultProps = {
    noteId: "test-note-id",
    initialLikeCount: 5,
    initialIsLiked: false,
  };

  beforeEach(() => {
    mockLikeNote.mockClear();
    mockLikeNote.mockResolvedValue({ likeCount: 6 });
  });

  it("renders with initial like count", () => {
    render(<LikeButton {...defaultProps} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /like/i })).toBeInTheDocument();
  });

  it("shows liked state when initially liked", () => {
    render(<LikeButton {...defaultProps} initialIsLiked={true} />);

    const likeButton = screen.getByRole("button", { name: /unlike/i });
    expect(likeButton).toHaveClass("liked"); // Assuming there's a liked class
  });

  it("calls like API when clicked", async () => {
    const user = userEvent.setup();
    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    await user.click(likeButton);

    expect(mockLikeNote).toHaveBeenCalledWith(defaultProps.noteId);
  });

  it("updates like count after successful like", async () => {
    const user = userEvent.setup();
    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    await user.click(likeButton);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("toggles liked state after clicking", async () => {
    const user = userEvent.setup();
    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    await user.click(likeButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /unlike/i })
      ).toBeInTheDocument();
    });
  });

  it("shows loading state while liking", async () => {
    const user = userEvent.setup();
    // Make the API call take some time
    mockLikeNote.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ likeCount: 6 }), 100)
        )
    );

    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    await user.click(likeButton);

    expect(likeButton).toBeDisabled();

    await waitFor(() => {
      expect(likeButton).not.toBeDisabled();
    });
  });

  it("handles like error gracefully", async () => {
    const user = userEvent.setup();
    mockLikeNote.mockRejectedValue(new Error("Network error"));

    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    await user.click(likeButton);

    await waitFor(() => {
      // Should still show original count on error
      expect(screen.getByText("5")).toBeInTheDocument();
      // Should show error message or toast
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it("prevents double-clicking", async () => {
    const user = userEvent.setup();
    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });

    // Click multiple times quickly
    await user.click(likeButton);
    await user.click(likeButton);
    await user.click(likeButton);

    // Should only call API once
    expect(mockLikeNote).toHaveBeenCalledTimes(1);
  });

  it("shows heart icon", () => {
    render(<LikeButton {...defaultProps} />);

    // Assuming the component uses a heart icon
    const heartIcon = screen.getByTestId("heart-icon"); // or however the icon is identified
    expect(heartIcon).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    expect(likeButton).toHaveAttribute("aria-label");
    expect(likeButton).toHaveAttribute("type", "button");
  });
});
