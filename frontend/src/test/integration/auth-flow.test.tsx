import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../utils";
import App from "../../App";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Authentication Flow Integration", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it("allows user to login and access protected content", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Should show login form initially
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(loginButton);

    // Should redirect to dashboard/home after successful login
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Should store token in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "token",
      "mock-jwt-token"
    );

    // Should show user menu/profile
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("allows user to register and login", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to register form
    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);

    // Fill in registration form
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(nameInput, "New User");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(registerButton);

    // Should redirect to dashboard after successful registration
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Should store token in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "token",
      "mock-jwt-token"
    );
  });

  it("handles login errors gracefully", async () => {
    const user = userEvent.setup();

    // Mock failed login response
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password",
            },
          },
          { status: 401 }
        );
      })
    );

    render(<App />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "wrong@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(loginButton);

    // Should show error message
    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i)
      ).toBeInTheDocument();
    });

    // Should not store token
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Should remain on login page
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("allows user to logout", async () => {
    const user = userEvent.setup();

    // Mock authenticated state
    localStorageMock.getItem.mockReturnValue("mock-jwt-token");

    render(<App />);

    // Should show authenticated content
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Click logout
    const userMenu = screen.getByText("Test User");
    await user.click(userMenu);

    const logoutButton = screen.getByText(/logout/i);
    await user.click(logoutButton);

    // Should remove token from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  it("persists authentication across page reloads", async () => {
    // Mock existing token in localStorage
    localStorageMock.getItem.mockReturnValue("mock-jwt-token");

    render(<App />);

    // Should automatically authenticate and show dashboard
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Should not show login form
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it("handles expired tokens gracefully", async () => {
    // Mock expired token
    localStorageMock.getItem.mockReturnValue("expired-token");

    // Mock 401 response for /auth/me
    server.use(
      http.get(`${API_BASE_URL}/auth/me`, () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "INVALID_TOKEN", message: "Token expired" },
          },
          { status: 401 }
        );
      })
    );

    render(<App />);

    // Should remove expired token and show login
    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  it("redirects to intended page after login", async () => {
    const user = userEvent.setup();

    // Try to access protected route
    window.history.pushState({}, "", "/notes/create");

    render(<App />);

    // Should redirect to login
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();

    // Login
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(loginButton);

    // Should redirect to originally intended page
    await waitFor(() => {
      expect(window.location.pathname).toBe("/notes/create");
    });
  });

  it("shows social login options", () => {
    render(<App />);

    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with github/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
  });

  it("validates form inputs before submission", async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(loginButton);

    // Should show validation errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Should not make API call
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});
