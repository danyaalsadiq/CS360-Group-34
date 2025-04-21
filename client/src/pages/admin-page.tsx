import { useState } from 'react';
import { useLocation } from 'wouter';
import { User, CalendarDays, UserRound, ShieldAlert, Shield, Settings, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManageTherapists } from '@/components/admin/manage-therapists';
import { ManageStudents } from '@/components/admin/manage-students';
import { ForumModeration } from '@/components/admin/forum-moderation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminPage = () => {
  const [_, navigate] = useLocation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'therapists':
        return <ManageTherapists />;
      case 'students':
        return <ManageStudents />;
      case 'forum-moderation':
        return <ForumModeration />;
      default:
        return (
          <div className="container mx-auto py-12">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage users, appointments, and system settings
                </p>
              </div>
              <Button onClick={handleBackToHome} variant="outline">
                Back to Home
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOptionClick('therapists')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">Manage Therapists</CardTitle>
                  <UserRound className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    View and manage therapist calendars, schedule appointments, and modify availability
                  </CardDescription>
                  <Button variant="default" className="w-full mt-4" onClick={() => handleOptionClick('therapists')}>
                    Manage Therapists
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOptionClick('students')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">Manage Students</CardTitle>
                  <User className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    View and manage student appointments, waitlists, and requests
                  </CardDescription>
                  <Button variant="default" className="w-full mt-4" onClick={() => handleOptionClick('students')}>
                    Manage Students
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOptionClick('forum-moderation')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">Forum Moderation</CardTitle>
                  <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    Review reported content, moderate discussions, and manage forum
                  </CardDescription>
                  <Button variant="default" className="w-full mt-4" onClick={() => handleOptionClick('forum-moderation')}>
                    Moderate Forums
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                  <CardDescription>
                    Overview of the system usage and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>Total Users</span>
                      </div>
                      <span className="font-semibold">Loading...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>Active Appointments</span>
                      </div>
                      <span className="font-semibold">Loading...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ListChecks className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>Pending Requests</span>
                      </div>
                      <span className="font-semibold">Loading...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>
                    Quick actions for administrators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Shield className="mr-2 h-4 w-4" />
                      Generate System Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default AdminPage;