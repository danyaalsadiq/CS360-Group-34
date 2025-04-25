import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Goal } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GoalModal } from "./goal-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isPast } from "date-fns";

type ExtendedGoal = Goal & {
  therapist?: { id: number; name: string; };
  student?: { id: number; name: string; };
};

export function GoalList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    data: goals = [], 
    isLoading,
    refetch
  } = useQuery<ExtendedGoal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user
  });

  const handleToggleGoal = async (id: number, completed: boolean) => {
    try {
      await apiRequest("PATCH", `/api/goals/${id}`, { completed });
      
      // Invalidate the goals query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      
      toast({
        title: completed ? "Goal completed" : "Goal marked as incomplete",
        description: completed ? 
          "Congratulations on making progress!" : 
          "Keep working towards your goal!",
      });
    } catch (error) {
      toast({
        title: "Error updating goal",
        description: "Failed to update goal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Organize goals by status
  const completedGoals = goals.filter(goal => goal.completed);
  const activeGoals = goals.filter(goal => !goal.completed && !isPast(new Date(goal.dueDate)));
  const overdue = goals.filter(goal => !goal.completed && isPast(new Date(goal.dueDate)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Mental Health Goals</h2>
        {(user?.role === "therapist" || user?.role === "admin") && (
          <Button onClick={() => setIsModalOpen(true)}>
            Create New Goal
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading goals...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Active Goals</h3>
              <div className="space-y-4">
                {activeGoals.map(goal => (
                  <Card key={goal.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`goal-${goal.id}`} 
                            checked={goal.completed}
                            onCheckedChange={(checked) => {
                              if (user?.role === "therapist" || user?.role === "admin" || user?.id === goal.studentId) {
                                handleToggleGoal(goal.id, checked as boolean);
                              }
                            }}
                            disabled={user?.role !== "therapist" && user?.role !== "admin" && user?.id !== goal.studentId}
                          />
                          <label 
                            htmlFor={`goal-${goal.id}`}
                            className="ml-3 font-medium"
                          >
                            {goal.title}
                          </label>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Due: {format(new Date(goal.dueDate), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground">
                            {user?.role === "student" 
                              ? `Set by ${goal.therapist?.name}` 
                              : `Assigned to ${goal.student?.name}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {overdue.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Overdue Goals</h3>
              <div className="space-y-4">
                {overdue.map(goal => (
                  <Card key={goal.id} className="border-red-200 dark:border-red-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`goal-${goal.id}`} 
                            checked={goal.completed}
                            onCheckedChange={(checked) => {
                              if (user?.role === "therapist" || user?.role === "admin" || user?.id === goal.studentId) {
                                handleToggleGoal(goal.id, checked as boolean);
                              }
                            }}
                            disabled={user?.role !== "therapist" && user?.role !== "admin" && user?.id !== goal.studentId}
                          />
                          <label 
                            htmlFor={`goal-${goal.id}`}
                            className="ml-3 font-medium"
                          >
                            {goal.title}
                          </label>
                        </div>
                        <Badge variant="destructive">Overdue</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-red-500">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Due: {format(new Date(goal.dueDate), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground">
                            {user?.role === "student" 
                              ? `Set by ${goal.therapist?.name}` 
                              : `Assigned to ${goal.student?.name}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Completed Goals</h3>
              <div className="space-y-4">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`goal-${goal.id}`} 
                            checked={goal.completed}
                            onCheckedChange={(checked) => {
                              if (user?.role === "therapist" || user?.role === "admin" || user?.id === goal.studentId) {
                                handleToggleGoal(goal.id, checked as boolean);
                              }
                            }}
                            disabled={user?.role !== "therapist" && user?.role !== "admin" && user?.id !== goal.studentId}
                          />
                          <label 
                            htmlFor={`goal-${goal.id}`}
                            className="ml-3 font-medium line-through text-muted-foreground"
                          >
                            {goal.title}
                          </label>
                        </div>
                        <Badge variant="outline" className="border-green-200 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Due: {format(new Date(goal.dueDate), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground">
                            {user?.role === "student" 
                              ? `Set by ${goal.therapist?.name}` 
                              : `Assigned to ${goal.student?.name}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {goals.length === 0 && (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <CardTitle className="text-xl mb-2">No Goals Found</CardTitle>
                <p className="text-muted-foreground">
                  {user?.role === "student" 
                    ? "Your therapist will help set goals for your mental health journey." 
                    : "Create goals to help track student progress."}
                </p>
                {(user?.role === "therapist" || user?.role === "admin") && (
                  <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                    Create First Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {(user?.role === "therapist" || user?.role === "admin") && (
        <GoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
