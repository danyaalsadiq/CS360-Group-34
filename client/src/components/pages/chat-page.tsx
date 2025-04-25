import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { AiChat } from "@/components/chat/ai-chat";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
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

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Website Navigation Assistant</h2>
          <p className="text-muted-foreground mt-1">
            Get help finding and using features on the CAPS Management System
          </p>
        </div>
        
        <AiChat />
      </div>
    </AppLayout>
  );
}
