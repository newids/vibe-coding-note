import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../../test/utils";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  const defaultProps = {
    onSearch: vi.fn(),
    placeholder: "Search notes...",
    initialValue: "",
  };

  beforeEach(() => {
    defaultProps.onSearch.mockClear();
  });

  it("renders search input with placeholder", () => {
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "search");
  });

  it("shows initial value when provided", () => {
    render(<SearchBar {...defaultProps} initialValue="react hooks" />);

    const searchInput = screen.getByDisplayValue("react hooks");
    expect(searchInput).toBeInTheDocument();
  });

  it("calls onSearch when user types", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "react");

    // Should debounce the search calls
    await waitFor(
      () => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith("react");
      },
      { timeout: 1000 }
    );
  });

  it("debounces search calls", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");

    // Type quickly
    await user.type(searchInput, "react hooks");

    // Should not call onSearch for each character
    expect(defaultProps.onSearch).not.toHaveBeenCalled();

    // Should call after debounce delay
    await waitFor(
      () => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith("react hooks");
      },
      { timeout: 1000 }
    );

    // Should only be called once after debounce
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it("shows search icon", () => {
    render(<SearchBar {...defaultProps} />);

    const searchIcon = screen.getByTestId("search-icon"); // or however the icon is identified
    expect(searchIcon).toBeInTheDocument();
  });

  it("shows clear button when input has value", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "react");

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "react");

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue("");
    expect(defaultProps.onSearch).toHaveBeenCalledWith("");
  });

  it("handles Enter key press", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "react");
    await user.keyboard("{Enter}");

    // Should trigger immediate search on Enter
    expect(defaultProps.onSearch).toHaveBeenCalledWith("react");
  });

  it("handles Escape key to clear input", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "react");
    await user.keyboard("{Escape}");

    expect(searchInput).toHaveValue("");
    expect(defaultProps.onSearch).toHaveBeenCalledWith("");
  });

  it("focuses input when search icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchIcon = screen.getByTestId("search-icon");
    const searchInput = screen.getByPlaceholderText("Search notes...");

    await user.click(searchIcon);

    expect(searchInput).toHaveFocus();
  });

  it("has proper accessibility attributes", () => {
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    expect(searchInput).toHaveAttribute("aria-label", "Search");
    expect(searchInput).toHaveAttribute("role", "searchbox");
  });

  it("shows loading state during search", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} isLoading={true} />);

    const loadingIndicator = screen.getByTestId("search-loading"); // or spinner
    expect(loadingIndicator).toBeInTheDocument();
  });

  it("handles special characters in search", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "C++ & JavaScript!");

    await waitFor(
      () => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith("C++ & JavaScript!");
      },
      { timeout: 1000 }
    );
  });

  it("trims whitespace from search query", async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search notes...");
    await user.type(searchInput, "  react hooks  ");

    await waitFor(
      () => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith("react hooks");
      },
      { timeout: 1000 }
    );
  });
});
