import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { ForumList } from "@/components/forums/forum-list";
import { Loader2 } from "lucide-react";

export default function ForumsPage() {
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
      <div className="max-w-6xl mx-auto">
        <ForumList />
      </div>
    </AppLayout>
  );
}
