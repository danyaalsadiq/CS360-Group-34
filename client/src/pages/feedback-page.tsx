import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import { Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function FeedbackPage() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const params = useParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | undefined>(undefined);
  
  // Check for new feedback route with appointment ID
  useEffect(() => {
    if (location.startsWith("/feedback/new/") && params.id) {
      const id = parseInt(params.id);
      if (!isNaN(id)) {
        setAppointmentId(id);
        setIsModalOpen(true);
      }
    }
  }, [location, params]);

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
        <FeedbackList />
        
        <FeedbackModal
          isOpen={isModalOpen}
          appointmentId={appointmentId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            window.history.pushState(null, "", "/feedback");
          }}
        />
      </div>
    </AppLayout>
  );
}
