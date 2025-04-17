import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TherapistDashboard } from "@/components/dashboard/therapist-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();

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

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case "student":
        return <StudentDashboard />;
      case "therapist":
        return <TherapistDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return <AppLayout>{renderDashboard()}</AppLayout>;
}
