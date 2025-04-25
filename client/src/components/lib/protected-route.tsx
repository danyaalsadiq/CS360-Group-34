import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

type AllowedRoles = "student" | "therapist" | "admin" | undefined;

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
  requiredRole,
}: {
  path: string;
  component: React.ComponentType;
  allowedRoles?: AllowedRoles[];
  requiredRole?: AllowedRoles;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!user && !isLoading && location !== "/auth") {
      setLocation("/auth");
      return;
    }

    // Redirect admin users to admin dashboard when they try to access the root path
    if (user && user.role === "admin" && path === "/" && location === "/") {
      setLocation("/admin");
    }
  }, [user, isLoading, location, setLocation, path]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // For admin users attempting to access root path, don't render anything as they'll be redirected
  if (user.role === "admin" && path === "/" && location === "/") {
    return null;
  }

  // Check for required role
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground text-center">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  // Check for allowed roles (backward compatibility)
  if (allowedRoles && !allowedRoles.includes(user.role as AllowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground text-center">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <Route path={path}>
      {() => <Component />}
    </Route>
  );
}