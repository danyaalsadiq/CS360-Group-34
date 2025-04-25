import React from 'react';
import { SlotCalendar } from '@/components/scheduling/slot-calendar';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SchedulePage() {
  const { user } = useAuth();
  const isTherapist = user?.role === 'therapist';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const [, setLocation] = useLocation();
  
  const handleBackClick = () => {
    setLocation('/');
  };
  
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Scheduling</h1>
        <p className="text-muted-foreground">
          {isTherapist && 'Manage your availability and view your scheduled appointments.'}
          {isStudent && 'Request appointments and view your scheduled sessions.'}
          {isAdmin && 'Manage and oversee all scheduling activities.'}
        </p>
      </header>
      
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          {isAdmin && <TabsTrigger value="requests">Requests</TabsTrigger>}
          {isAdmin && <TabsTrigger value="cancellations">Cancellations</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          <SlotCalendar />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="requests" className="mt-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Student Appointment Requests</h2>
              <p className="text-muted-foreground mb-6">
                Review and process student appointment requests.
              </p>
              <div className="space-y-4">
                <p>No pending requests at this time.</p>
              </div>
            </div>
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="cancellations" className="mt-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Therapist Cancellation Requests</h2>
              <p className="text-muted-foreground mb-6">
                Review and process cancellation requests from therapists.
              </p>
              <div className="space-y-4">
                <p>No pending cancellation requests at this time.</p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {isAdmin && (
        <div className="flex items-center justify-between rounded-lg border bg-card p-6 mt-6">
          <div>
            <h3 className="text-lg font-medium">Weekly Schedule Generation</h3>
            <p className="text-muted-foreground">
              Automatically generate the weekly schedule based on therapist availability and student requests.
            </p>
          </div>
          <Button>Generate Schedule</Button>
        </div>
      )}
    </div>
  );
}