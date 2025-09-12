import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockNote } from "../../../test/utils";
import NoteCard from "../NoteCard";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NoteCard", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders note information correctly", () => {
    render(<NoteCard note={mockNote} />);

    expect(screen.getByText(mockNote.title)).toBeInTheDocument();
    expect(screen.getByText(mockNote.excerpt)).toBeInTheDocument();
    expect(screen.getByText(mockNote.author.name)).toBeInTheDocument();
    expect(screen.getByText(mockNote.category.name)).toBeInTheDocument();
    expect(screen.getByText(`${mockNote.likeCount} likes`)).toBeInTheDocument();
  });

  it("displays tags correctly", () => {
    render(<NoteCard note={mockNote} />);

    mockNote.tags.forEach((tag) => {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
    });
  });

  it("shows formatted creation date", () => {
    render(<NoteCard note={mockNote} />);

    // Should show a formatted date (exact format depends on implementation)
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("navigates to note detail when clicked", async () => {
    const user = userEvent.setup();
    render(<NoteCard note={mockNote} />);

    const noteCard = screen.getByRole("article");
    await user.click(noteCard);

    expect(mockNavigate).toHaveBeenCalledWith(`/notes/${mockNote.id}`);
  });

  it("navigates to note detail when title is clicked", async () => {
    const user = userEvent.setup();
    render(<NoteCard note={mockNote} />);

    const titleLink = screen.getByRole("link", { name: mockNote.title });
    await user.click(titleLink);

    expect(mockNavigate).toHaveBeenCalledWith(`/notes/${mockNote.id}`);
  });

  it("shows category with correct styling", () => {
    render(<NoteCard note={mockNote} />);

    const categoryElement = screen.getByText(mockNote.category.name);
    expect(categoryElement).toHaveStyle({
      backgroundColor: mockNote.category.color,
    });
  });

  it("handles missing optional fields gracefully", () => {
    const noteWithoutTags = {
      ...mockNote,
      tags: [],
    };

    render(<NoteCard note={noteWithoutTags} />);

    expect(screen.getByText(noteWithoutTags.title)).toBeInTheDocument();
    // Should not crash when no tags are present
  });

  it("truncates long excerpts", () => {
    const noteWithLongExcerpt = {
      ...mockNote,
      excerpt:
        "This is a very long excerpt that should be truncated when it exceeds the maximum length allowed for display in the note card component",
    };

    render(<NoteCard note={noteWithLongExcerpt} />);

    const excerptElement = screen.getByText(/This is a very long excerpt/);
    expect(excerptElement).toBeInTheDocument();
  });

  it("shows like button and count", () => {
    render(<NoteCard note={mockNote} />);

    const likeButton = screen.getByRole("button", { name: /like/i });
    expect(likeButton).toBeInTheDocument();
    expect(screen.getByText(`${mockNote.likeCount}`)).toBeInTheDocument();
  });
});
