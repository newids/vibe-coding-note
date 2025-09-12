import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, tokenStorage, type User } from "../lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current user query
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = tokenStorage.get();
      if (!token) return null;

      try {
        const response = await authApi.getCurrentUser(token);
        return response.data.user;
      } catch (error) {
        // If token is invalid, remove it
        tokenStorage.remove();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await authApi.login({ email, password });
      return response;
    },
    onSuccess: (data) => {
      tokenStorage.set(data.data.token);
      queryClient.setQueryData(["currentUser"], data.data.user);
      setError(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Login failed";
      setError(message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      const response = await authApi.register({ email, password, name });
      return response;
    },
    onSuccess: (data) => {
      tokenStorage.set(data.data.token);
      queryClient.setQueryData(["currentUser"], data.data.user);
      setError(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message || "Registration failed";
      setError(message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = tokenStorage.get();
      if (token) {
        await authApi.logout(token);
      }
    },
    onSuccess: () => {
      tokenStorage.remove();
      queryClient.setQueryData(["currentUser"], null);
      queryClient.clear();
      setError(null);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, name: string) => {
    await registerMutation.mutateAsync({ email, password, name });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const provider = urlParams.get("provider");

    if (token && provider) {
      tokenStorage.set(token);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  const value: AuthContextType = {
    user: user || null,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
