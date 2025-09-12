import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../../test/utils";
import LoginForm from "../LoginForm";

// Mock the auth context
const mockLogin = vi.fn();
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it("renders login form with email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("calls login function with correct credentials", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("disables submit button when form is invalid", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Initially disabled due to empty fields
    expect(submitButton).toBeDisabled();

    // Still disabled with invalid email
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "invalid-email");
    expect(submitButton).toBeDisabled();

    // Enabled with valid email and password
    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, "password123");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("shows loading state during login", () => {
    // Mock loading state
    vi.mocked(vi.importActual("../../../contexts/AuthContext")).useAuth =
      () => ({
        login: mockLogin,
        isLoading: true,
        error: null,
      });

    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it("displays error message when login fails", () => {
    // Mock error state
    vi.mocked(vi.importActual("../../../contexts/AuthContext")).useAuth =
      () => ({
        login: mockLogin,
        isLoading: false,
        error: "Invalid credentials",
      });

    render(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
