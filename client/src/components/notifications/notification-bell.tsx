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
          </Button>
        </div>
      </div>
    );
  };

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
}