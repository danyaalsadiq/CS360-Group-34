<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Define the interface for notification objects
interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

// WebSocket connection for real-time updates
let socket: WebSocket | null = null;

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on component mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Connection tracking
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      const attemptConnection = () => {
        if (connectionAttempts < maxConnectionAttempts) {
          connectionAttempts++;
          console.log(`WebSocket connection attempt ${connectionAttempts}/${maxConnectionAttempts}`);
          
          // Connect to WebSocket for real-time updates
          setupWebSocket();
          
          // If connection fails, try again after a delay
          setTimeout(() => {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
              console.log('Previous connection attempt failed, retrying...');
              attemptConnection();
            }
          }, 2000);
        } else {
          console.warn(`Failed to establish WebSocket connection after ${maxConnectionAttempts} attempts`);
          // Fall back to polling approach
          const pollingInterval = setInterval(() => {
            console.log('Polling for notifications as WebSocket failed');
            fetchNotifications();
          }, 30000); // Poll every 30 seconds
          
          // Clean up polling on unmount
          return () => clearInterval(pollingInterval);
        }
      };
      
      // Initial connection attempt
      attemptConnection();
      
      return () => {
        // Clean up WebSocket connection on component unmount
        if (socket) {
          console.log('Cleaning up WebSocket connection on component unmount');
          socket.close();
          socket = null;
        }
      };
    }
  }, [user]);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Connect to WebSocket for real-time updates
  const setupWebSocket = () => {
    if (!user) {
      console.log('No user available for WebSocket connection');
      return;
    }
    
    // Close existing connection if any
    if (socket) {
      console.log('Closing existing WebSocket connection');
      socket.close();
    }
    
    try {
      // Determine WebSocket protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`Attempting to connect WebSocket to: ${wsUrl}`);
      
      // Create new WebSocket connection
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected successfully');
        // Register for notifications for this user
        if (socket && socket.readyState === WebSocket.OPEN) {
          const registerMessage = JSON.stringify({
            type: 'register',
            userId: user.id
          });
          console.log(`Sending register message: ${registerMessage}`);
          socket.send(registerMessage);
        } else {
          console.log(`Socket not ready, state: ${socket?.readyState}`);
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
    
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received message:', data);
          
          if (data.type === 'notification') {
            // Add new notification to the list
            setNotifications(prev => [data.notification, ...prev]);
            
            // Show toast notification
            toast({
              title: data.notification.title,
              description: data.notification.message,
            });
          } else if (data.type === 'welcome' || data.type === 'registration_success') {
            console.log('WebSocket connection confirmed:', data.message);
          } else if (data.type === 'error') {
            console.error('WebSocket error message:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code ${event.code} and reason: ${event.reason}`);
        // Try to reconnect after a delay
        setTimeout(setupWebSocket, 5000);
      };
    } else {
      console.error('Failed to establish WebSocket connection');
    }
  };

  // Fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Error fetching notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/notifications/${id}/read`);
      if (response.ok) {
        // Update the notification in the list
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await apiRequest('PATCH', `/api/notifications/mark-all-read`);
      if (response.ok) {
        // Update all notifications in the list
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/notifications/${id}`);
      if (response.ok) {
        // Remove the notification from the list
        setNotifications(prev => 
          prev.filter(notification => notification._id !== id)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format notification date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Get notification badge color based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'appointment_assigned':
        return <Badge className="bg-emerald-500">Assigned</Badge>;
      case 'appointment_cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'appointment_completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'system':
        return <Badge>System</Badge>;
      case 'slot_unavailable':
        return <Badge className="bg-orange-500">Unavailable</Badge>;
      case 'slot_reassignment_pending':
        return <Badge className="bg-amber-500">Reassignment</Badge>;
      case 'availability_cancelled':
        return <Badge className="bg-red-400">Cancelled</Badge>;
      case 'waitlist_matched':
        return <Badge className="bg-green-500">Matched</Badge>;
      case 'appointment_reminder':
        return <Badge className="bg-purple-500">Reminder</Badge>;
      default:
        return <Badge variant="outline">{type.replace(/_/g, ' ')}</Badge>;
    }
  };

  // Render the notification item
  const renderNotificationItem = (notification: Notification) => {
    return (
      <div 
        key={notification._id}
        className={`p-4 border-b ${notification.isRead ? 'bg-background' : 'bg-muted/30'}`}
        onClick={() => markAsRead(notification._id)}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="font-medium">{notification.title}</div>
          {getNotificationBadge(notification.type)}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{formatDate(notification.createdAt)}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification._id);
            }}
          >
            Delete
=======
import { useState } from 'react';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface AlternativeSlotFormProps {
  date: string;
  startTime: string;
  endTime: string;
  therapistId?: string;
  therapistName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AlternativeSlotForm({
  date,
  startTime,
  endTime,
  therapistId,
  therapistName,
  onSuccess,
  onCancel
}: AlternativeSlotFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for option selection
  const [option, setOption] = useState<'auto' | 'other'>('auto');
  
  // State for response display
  const [responseStatus, setResponseStatus] = useState<'idle' | 'loading' | 'success' | 'no_match' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [alternativeSlot, setAlternativeSlot] = useState<any>(null);
  
  // Submit alternative slot request
  const requestAlternativeMutation = useMutation({
    mutationFn: async () => {
      // If option is 'auto', try to find the next available slot
      // If option is 'other', just add student to waiting list for the selected date/time
      
      if (option === 'auto') {
        // Send the request to find any available slot
        const response = await apiRequest(
          'POST',
          '/api/slots/student/request',
          {
            preferred_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
            preferred_times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            preferred_therapist_id: therapistId,
            notes: `Auto-requested after original slot was unavailable`
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to request alternative slot');
        }
        
        return response.json();
      } else {
        // Add student to waiting list for the specific date/time
        const response = await apiRequest(
          'POST',
          '/api/slots/student/request',
          {
            specific_date: date,
            specific_time: startTime,
            preferred_therapist_id: therapistId,
            notes: 'Waiting for therapist to mark this slot as available'
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add to waiting list');
        }
        
        return response.json();
      }
    },
    onSuccess: (data) => {
      console.log('Alternative slot response:', data);
      
      if (data.match_status === 'matched' || data.match_status === 'alternate_offered') {
        // Found an immediate match
        setResponseStatus('success');
        setAlternativeSlot(data);
        setResponseMessage('Great! We found an available slot for you.');
        queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      } else if (data.match_status === 'waiting') {
        // Added to waiting list
        setResponseStatus('success');
        setResponseMessage(data.message || 'You have been added to the waiting list for this slot. You will be notified if the therapist makes this slot available.');
        queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
        
        // Close the modal after a short delay for waiting list confirmation
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else if (data.match_status === 'no_match' || data.match_status === 'pending') {
        // No match found
        setResponseStatus('no_match');
        setResponseMessage(data.message || 'No matching slots were found. Please try selecting different availability options.');
      } else {
        // For 'already_booked' or other unknown statuses
        setResponseStatus('success');
        setResponseMessage(data.message || 'Your request has been processed.');
        
        // Close the modal after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    },
    onError: (error: Error) => {
      console.error('Alternative slot request error:', error);
      setResponseStatus('error');
      setResponseMessage(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = () => {
    setResponseStatus('loading');
    requestAlternativeMutation.mutate();
  };
  
  // Render the success message after finding an alternative slot
  const renderSuccess = () => {
    if (!alternativeSlot) {
      return (
        <Alert className="bg-green-50 border-green-200 mb-4">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Alternative Slot Details</CardTitle>
            <CardDescription>
              You've been assigned to the following slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{format(new Date(alternativeSlot.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Time:</span>
                <span className="text-sm">{alternativeSlot.start_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Therapist:</span>
                <span className="text-sm">{alternativeSlot.therapist_name}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={onSuccess}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Render the no match message
  const renderNoMatch = () => {
    return (
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Close
          </Button>
          <Button onClick={onSuccess}>
            View Calendar
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
          </Button>
        </div>
      </div>
    );
  };
<<<<<<< HEAD

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="p-4 border-b">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription className="flex justify-between">
            <span>Stay updated with your appointments and system messages.</span>
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.isRead)}
              >
                Mark all as read
              </Button>
            )}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
            {loading ? (
              renderSkeletons()
            ) : notifications.length > 0 ? (
              notifications.map(renderNotificationItem)
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No notifications yet.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
=======
  
  // Render the error message
  const renderError = () => {
    return (
      <div className="space-y-4">
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">
            {responseMessage || 'An error occurred while processing your request. Please try again.'}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={() => setResponseStatus('idle')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  };
  
  // Render the form
  const renderForm = () => {
    return (
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">
            This slot is already booked or not yet marked by the therapist. You can either join the waiting list for this specific time, or let the system find you any available slot with {therapistName || 'this therapist'}.
          </AlertDescription>
        </Alert>
        
        <RadioGroup value={option} onValueChange={(value) => setOption(value as 'auto' | 'other')} className="space-y-4">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="auto" id="auto" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="auto" className="font-medium">
                Find me the next available slot
              </Label>
              <p className="text-sm text-muted-foreground">
                The system will automatically find and book you into the next available slot with {therapistName || 'this therapist'}.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="other" id="other" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="other" className="font-medium">
                Join waiting list for this slot
              </Label>
              <p className="text-sm text-muted-foreground">
                You'll be added to the waiting list for this specific time slot. If the therapist marks it as available, you may be assigned to it.
              </p>
            </div>
          </div>
        </RadioGroup>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue
          </Button>
        </div>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin text-primary mx-auto h-6 w-6 mb-4">
          <RefreshCw className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Looking for available slots...
        </p>
      </div>
    );
  };
  
  // Determine which content to render based on the response status
  switch (responseStatus) {
    case 'loading':
      return renderLoading();
    case 'success':
      return renderSuccess();
    case 'no_match':
      return renderNoMatch();
    case 'error':
      return renderError();
    case 'idle':
    default:
      return renderForm();
  }
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
}