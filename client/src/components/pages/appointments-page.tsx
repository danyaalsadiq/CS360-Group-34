import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AppointmentsPage() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Get appointment ID from URL if on new appointment page
  const isNewAppointment = location === "/appointments/new";

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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <AppointmentList />
      </div>
    </AppLayout>
  );
}
