import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TherapistDashboard } from "@/components/dashboard/therapist-dashboard";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect admin users to the admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle redirection if no user
  }

  // Admin users will be redirected to /admin
  if (user.role === "admin") {
    return null;
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case "student":
        return <StudentDashboard />;
      case "therapist":
        return <TherapistDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return <AppLayout>{renderDashboard()}</AppLayout>;
}
