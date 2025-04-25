import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SendHorizontal, User, BrainCircuit, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function AiChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch existing chat messages
  const { 
    data: messages = [], 
    isLoading,
    error
  } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: !!user
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat/messages", { content });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: (newMessages) => {
      // Make sure we're working with an array of messages
      const messagesToAdd = Array.isArray(newMessages) ? newMessages : [newMessages];
      
      // Update the chat messages in the cache
      queryClient.setQueryData(["/api/chat/messages"], (oldData: ChatMessage[] = []) => [
        ...oldData,
        ...messagesToAdd
      ]);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    }
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const messageToSend = message.trim();
    setMessage(""); // Clear input immediately for better UX
    
    try {
      await sendMessageMutation.mutateAsync(messageToSend);
      // Scroll to bottom after sending message
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      // If there was an error, put the message back in the input
      setMessage(messageToSend);
    }
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: ChatMessage[] } = {};
  
  messages.forEach(msg => {
    // Safely handle date conversion
    let dateStr = 'Today';
    try {
      if (msg.createdAt) {
        const msgDate = new Date(msg.createdAt);
        dateStr = format(msgDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    
    groupedMessages[dateStr].push(msg);
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] md:h-[calc(100vh-14rem)]">
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Website Navigation Assistant</CardTitle>
        </CardHeader>
        
        <CardContent ref={scrollAreaRef} className="flex-1 px-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-20rem)] px-4 py-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading conversation...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                <p className="text-destructive font-medium">Failed to load messages</p>
                <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BrainCircuit className="h-16 w-16 text-primary/60 mb-4" />
                <h3 className="text-xl font-medium mb-2">Website Navigation Assistant</h3>
                <p className="text-muted-foreground max-w-md">
                  I'm here to help you navigate the CAPS Management System. Ask me about appointments, 
                  the calendar system, forums, feedback, waitlists, or any feature you need help with. 
                  All main features are accessible from the sidebar menu.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground">
                          {date}
                        </span>
                      </div>
                    </div>
                    
                    {msgs.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-start max-w-[80%] ${msg.isFromUser ? "flex-row-reverse" : ""}`}>
                          <div 
                            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              msg.isFromUser 
                                ? "bg-primary text-primary-foreground ml-2" 
                                : "bg-secondary text-secondary-foreground mr-2"
                            }`}
                          >
                            {msg.isFromUser 
                              ? <User className="h-4 w-4" /> 
                              : <BrainCircuit className="h-4 w-4" />
                            }
                          </div>
                          <div 
                            className={`px-4 py-2 rounded-lg ${
                              msg.isFromUser 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 min-h-[40px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={sendMessageMutation.isPending || !message.trim()}
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
