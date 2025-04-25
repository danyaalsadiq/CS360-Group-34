import { QueryClient } from "@tanstack/react-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ApiRequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

export const apiRequest = async (
  method: string,
  path: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<Response> => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(path, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || response.statusText);
  }

  return response;
};

export const getQueryFn =
  (options: { on401?: "throw" | "returnNull" } = { on401: "throw" }) =>
  async ({ queryKey }: { queryKey: string[] }) => {
    const [path] = queryKey;
    try {
      const response = await apiRequest("GET", path);
      return await response.json();
    } catch (error: any) {
      if (error.message === "Unauthorized" && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };