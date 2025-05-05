import { useState } from 'react';
import { useLocation } from 'wouter';
import { User, CalendarDays, UserRound, ShieldAlert, Shield, Settings, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManageTherapists } from '@/components/admin/manage-therapists';
import { ManageStudents } from '@/components/admin/manage-students';
import { ForumModeration } from '@/components/admin/forum-moderation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

const AdminPage = () => {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Fetch reported forum posts
  const { 
    data: reportedPosts = []
  } = useQuery<any[]>({
    queryKey: ["/api/admin/forum/reported"],
    retry: 1,
    enabled: user?.role === 'admin'
  });
  
  // Fetch reported comments
  const { 
    data: reportedCommentsRaw = []
  } = useQuery<any[]>({
    queryKey: ["/api/admin/forum/reported-comments"],
    retry: 1,
    enabled: user?.role === 'admin'
  });

  // Filter out deleted comments
  const reportedComments = reportedCommentsRaw.filter(comment => !comment.isDeleted);

  // Calculate total reports count
  const totalReportCount = (reportedPosts?.length || 0) + (reportedComments?.length || 0);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'therapists':
        return (
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold">Manage Therapists</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage therapist accounts, appointments, and availability
                </p>
              </div>
              <Button onClick={() => setSelectedOption(null)} variant="outline">
                Back to Dashboard
              </Button>
            </div>
            <ManageTherapists />
          </div>
        );
      case 'students':
        return (
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold">Manage Students</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage student accounts and appointments
                </p>
              </div>
              <Button onClick={() => setSelectedOption(null)} variant="outline">
                Back to Dashboard
              </Button>
            </div>
            <ManageStudents />
          </div>
        );
      case 'forum-moderation':
        return (
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold">Forum Moderation</h1>
                <p className="text-muted-foreground mt-1">
                  Review and moderate forum content and user reports
                </p>
              </div>
              <Button onClick={() => setSelectedOption(null)} variant="outline">
                Back to Dashboard
              </Button>
            </div>
            <ForumModeration />
          </div>
        );
      default:
        return (
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage users, appointments, and system settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Forum Moderation Card */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white" onClick={() => handleOptionClick('forum-moderation')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">Forum Moderation</CardTitle>
                  <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    Review reported content, moderate discussions, and manage forum
                  </CardDescription>
                  <Button variant="default" className="w-full mt-4 relative" onClick={() => handleOptionClick('forum-moderation')}>
                    Moderate Forums
                    {totalReportCount > 0 && (
                      <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2 px-2 py-1 text-xs">
                        {totalReportCount}
                      </Badge>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Website Assistant Card - Added as requested */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">Website Assistant</CardTitle>
                  <UserRound className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    Get help navigating the platform with our website assistant
                  </CardDescription>
                  <Button variant="default" className="w-full mt-4" onClick={() => navigate('/chat')}>
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Removed System Statistics and Admin Actions cards */}
          </div>
        );
    }
  };

  // Show loading state or handle auth protection similar to other pages
  if (isLoading) {
    return null; // ProtectedRoute will handle loading state
  }

  if (!user) {
    return null; // ProtectedRoute will handle redirection if no user
  }

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
};

export default AdminPage;