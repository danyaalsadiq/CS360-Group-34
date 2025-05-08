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
  // Debug: log the backend base URL
  console.log("[apiRequest] VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

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

  // Use base URL from env in production, or relative path in dev
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const url = baseUrl && !path.startsWith("http") ? `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : "/" + path}` : path;

  // Debug: log the final URL used for the request
  console.log(`[apiRequest] Final URL:`, url);
  console.log("[env] VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
  
  try {
    const response = await fetch(url, config);
    
    console.log(`[apiRequest] Response status:`, response.status, response.statusText);
    
    if (!response.ok) {
      // Try to extract error message from response
      let errorMessage = `Status: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse JSON, use text instead
        try {
          const textError = await response.text();
          if (textError) {
            errorMessage = `${errorMessage} - ${textError.substring(0, 100)}...`;
          }
        } catch (textError) {
          // If we can't get text either, just use the status
          console.error('[apiRequest] Failed to extract error details:', textError);
        }
      }
      
      console.error(`[apiRequest] Request failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Handle network errors (like CORS, connection refused, etc.)
    console.error(`[apiRequest] Network error:`, error);
    throw error;
  }
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