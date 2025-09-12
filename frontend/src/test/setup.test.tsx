import { describe, it, expect } from "vitest";
import { render, screen, mockUser, mockNote } from "./utils";

// Simple test component
function TestComponent() {
  return <div>Hello Test</div>;
}

describe("Test Setup", () => {
  it("renders test component", () => {
    render(<TestComponent />);
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });

  it("has mock user available", () => {
    expect(mockUser.email).toBe("test@example.com");
  });

  it("has mock note available", () => {
    expect(mockNote.title).toBe("Test Note");
  });
});
