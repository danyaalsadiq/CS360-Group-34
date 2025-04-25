import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
// No longer using React Query for messages, but importing for future use if needed
// import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { SendHorizontal, User, BrainCircuit, AlertCircle, X, MessageSquareText } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export function ChatPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<Error | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Manual fetch function for messages with better error handling and temporary message preservation
  const fetchMessages = useCallback(async () => {
    if (!user || !isOpen) return;
    
    try {
      setIsLoadingMessages(true);
      
      // Create a timeout promise to abort the fetch if it takes too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch('/api/chat/messages');
      
      // Race the fetch against the timeout
      const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status} ${res.statusText}`);
      
      const data = await res.json();
      console.log('Fetched messages:', data.length);
      
      // Save the temporary messages so we can preserve them during updates
      const tempMessages = localMessages.filter(msg => {
        const idStr = String(msg.id);
        return !isNaN(Number(idStr)) || idStr.length < 10;
      });
      
      // Combine the server messages with any temporary messages
      const combinedMessages = [...data, ...tempMessages];
      
      // Remove duplicates by creating a Map with message ID as key
      const uniqueMessages = Array.from(
        new Map(combinedMessages.map(msg => [msg.id, msg])).values()
      );
      
      // Sort messages by creation time
      const sortedMessages = uniqueMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
      
      setLocalMessages(sortedMessages);
      setMessageError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Only set error if we don't have any messages yet
      if (localMessages.length === 0) {
        setMessageError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, isOpen, localMessages]);
  
  // Initial fetch and aggressive refresh interval - poll very frequently to ensure messages appear
  useEffect(() => {
    if (isOpen && user) {
      // Initial fetch immediately when opened
      fetchMessages();
      
      // Set up more frequent refresh interval (1 second)
      const intervalId = setInterval(fetchMessages, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [isOpen, user, fetchMessages]);
  
  // Direct send message function
  const [isSending, setIsSending] = useState(false);
  
  const sendMessage = async (content: string) => {
    try {
      setIsSending(true);
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      
      const newMessages = await response.json();
      console.log("Message sent successfully, received:", newMessages);
      
      // Completely replace localMessages with the full up-to-date list
      // Remove all temporary messages by their numeric ids
      setLocalMessages(currentMessages => {
        // Filter out temporary messages (those with numeric ids)
        const filteredMessages = currentMessages.filter(msg => {
          const idStr = String(msg.id);
          const isTemporaryId = !isNaN(Number(idStr)) || idStr.length < 10;
          return !isTemporaryId;
        });
        
        // Add the new server messages
        const messagesArray = Array.isArray(newMessages) ? newMessages : [newMessages];
        const updatedMessages = [...filteredMessages, ...messagesArray];
        
        // Sort messages by createdAt to ensure correct order
        return updatedMessages.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
      });
      
      // Force multiple fetches with delay to ensure we capture all updates
      // First fetch happens immediately
      fetchMessages();
      
      // Second fetch happens after a short delay
      setTimeout(() => {
        fetchMessages();
      }, 500);
      
      // Third fetch happens after a longer delay
      setTimeout(() => {
        fetchMessages();
      }, 1500);
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    } finally {
      setIsSending(false);
    }
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [localMessages]);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    // Create temporary ID
    const tempId = Date.now();
    
    // Immediately add user message to UI for responsive feedback
    const tempUserMessage: ChatMessage = {
      id: tempId,
      userId: String(user!.id),
      content: message.trim(),
      isFromUser: true,
      createdAt: new Date()
    } as unknown as ChatMessage;
    
    // Add a temporary thinking message from AI
    const tempAiMessage: ChatMessage = {
      id: tempId + 1,
      userId: String(user!.id),
      content: "Thinking...",
      isFromUser: false,
      createdAt: new Date()
    } as unknown as ChatMessage;
    
    // Add temporary messages to local state
    setLocalMessages(prev => [...prev, tempUserMessage, tempAiMessage]);
    
    // Clear input field
    setMessage("");
    
    // Send actual request to server
    await sendMessage(message.trim());
  };
  
  // Group messages by date
  const groupedMessages = localMessages.reduce((groups: Record<string, ChatMessage[]>, msg: ChatMessage) => {
    const date = msg.createdAt 
      ? format(new Date(msg.createdAt), 'MMMM d, yyyy')
      : "Today";
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 shadow-lg h-[500px] flex flex-col">
          <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Website Assistant</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleChat}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollAreaRef} className="flex-1 px-0 overflow-hidden">
            <ScrollArea className="h-[calc(500px-110px)] px-4 py-2">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading conversation...</p>
                </div>
              ) : messageError ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                  <p className="text-destructive font-medium">Failed to load messages</p>
                  <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                </div>
              ) : localMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <BrainCircuit className="h-16 w-16 text-primary/60 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Website Navigation Assistant</h3>
                  <p className="text-muted-foreground text-sm">
                    How can I help you navigate the platform today? Ask me about finding features or using the system.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMessages).map(([date, msgs]: [string, ChatMessage[]]) => (
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
                      
                      {msgs.map((msg: ChatMessage) => (
                        <div 
                          key={msg.id}
                          className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-start max-w-[80%] ${msg.isFromUser ? "flex-row-reverse" : ""}`}>
                            <div 
                              className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                                msg.isFromUser 
                                  ? "bg-primary text-primary-foreground ml-2" 
                                  : "bg-secondary text-secondary-foreground mr-2"
                              }`}
                            >
                              {msg.isFromUser 
                                ? <User className="h-3 w-3" /> 
                                : <BrainCircuit className="h-3 w-3" />
                              }
                            </div>
                            <div 
                              className={`px-3 py-2 rounded-lg text-xs ${
                                msg.isFromUser 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
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
          
          <CardFooter className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 min-h-[40px] max-h-[80px] text-sm"
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
                className="h-9 w-9"
                disabled={isSending || !message.trim()}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          onClick={toggleChat}
          className="rounded-full h-14 w-14 bg-[#417772] hover:bg-[#356560] text-white shadow-lg"
        >
          <MessageSquareText className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}