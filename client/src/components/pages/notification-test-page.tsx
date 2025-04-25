import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function NotificationTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message.');
  const [type, setType] = useState('appointment_assigned');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only allow admins to access this page
  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateNotification = async () => {
    try {
      setLoading(true);
      // We'll create a direct API call to the MongoDB to create a notification
      const res = await apiRequest('POST', '/api/notifications/test', {
        title,
        message,
        type,
        userId: user.id
      });
      
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Test notification created successfully',
        });
      } else {
        const data = await res.json();
        toast({
          title: 'Error',
          description: data.message || 'Failed to create test notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test notification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Notification Test Panel</CardTitle>
          <CardDescription>
            Create test notifications to verify the notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="font-medium">Message</label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="font-medium">Type</label>
            <Select
              value={type}
              onValueChange={setType}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment_assigned">Appointment Assigned</SelectItem>
                <SelectItem value="appointment_cancelled">Appointment Cancelled</SelectItem>
                <SelectItem value="appointment_completed">Appointment Completed</SelectItem>
                <SelectItem value="system">System Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCreateNotification}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : 'Create Test Notification'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}