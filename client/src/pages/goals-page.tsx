import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { GoalList } from "@/components/goals/goal-list";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function GoalsPage() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Check if we're on the new goal page
  const isNewGoal = location === "/goals/new";

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
        <GoalList />
      </div>
    </AppLayout>
  );
}
