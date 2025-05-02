import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ForumPost, ForumComment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  MessageSquare, 
  MessageCircle,
  Plus,
  User,
  Clock,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Heart,
  Flag,
  Trash2,
  Filter,
  ThumbsUp
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExtendedForumPost = ForumPost & {
  user: { 
    id: number; 
    name: string; 
    role: string;
    profileImage?: string;
  } | null;
  commentCount: number;
  hasLiked?: boolean;
};

type ExtendedForumComment = ForumComment & {
  user: { 
    id: number; 
    name: string; 
    role: string;
    profileImage?: string;
  } | null;
  hasLiked?: boolean;
};

const postFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().default("General"),
  isAnonymous: z.boolean().default(false)
});

const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isAnonymous: z.boolean().default(false)
});

export function ForumList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [postToReport, setPostToReport] = useState<ExtendedForumPost | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [selectedPost, setSelectedPost] = useState<ExtendedForumPost | null>(null);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Fetch forum posts
  const { 
    data: allPosts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery<ExtendedForumPost[]>({
    queryKey: ["/api/forum/posts"],
    queryFn: () => apiRequest("GET", "/api/forum/posts").then(res => res.json()),
    enabled: !!user
  });
  
  // Filter posts by category if applicable
  const posts = categoryFilter
    ? allPosts.filter(post => post.category === categoryFilter)
    : allPosts;
  
  // Create new post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof postFormSchema>) => {
      return apiRequest("POST", "/api/forum/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsNewPostModalOpen(false);
      toast({
        title: "Post created",
        description: "Your post has been published to the forum.",
      });
      postForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Create new comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ 
      postId, 
      data 
    }: { 
      postId: string; 
      data: z.infer<typeof commentFormSchema> 
    }) => {
      return apiRequest("POST", `/api/forum/posts/${postId}/comments`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/forum/posts", variables.postId, "comments"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({
        title: "Comment added",
        description: "Your comment has been added to the post.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Like post mutation with optimistic updates
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/forum/posts/${postId}/like`);
    },
    onMutate: async (postId) => {
      // Cancel any outgoing refetches 
      await queryClient.cancelQueries({ queryKey: ["/api/forum/posts"] });
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<ExtendedForumPost[]>(["/api/forum/posts"]);
      
      // Optimistically update to the new value
      if (previousPosts) {
        queryClient.setQueryData<ExtendedForumPost[]>(["/api/forum/posts"], 
          previousPosts.map(post => {
            if (post.id === postId) {
              // Toggle the like status
              const hasLiked = !post.hasLiked;
              const likesCount = hasLiked 
                ? [...post.likes, user!.id.toString()]
                : post.likes.filter(id => id !== user!.id.toString());
              
              return {
                ...post,
                hasLiked,
                likes: likesCount
              };
            }
            return post;
          })
        );
      }
      
      return { previousPosts };
    },
    onError: (error, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/forum/posts"], context.previousPosts);
      }
      
      toast({
        title: "Failed to update like",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to make sure the server state is reflected
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/forum/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Report post mutation
  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      return apiRequest("POST", `/api/forum/posts/${postId}/report`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsReportModalOpen(false);
      setPostToReport(null);
      setReportReason("");
      toast({
        title: "Post reported",
        description: "Thank you for reporting this content. Admins will review it shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to report post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Post form
  const postForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "General",
      isAnonymous: false
    }
  });
  
  // Comment form
  const commentForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
      isAnonymous: false
    }
  });
  
  const onPostSubmit = (data: z.infer<typeof postFormSchema>) => {
    createPostMutation.mutate(data);
  };
  
  const onCommentSubmit = (postId: string) => {
    const data = commentForm.getValues();
    createCommentMutation.mutate({ postId, data });
    commentForm.reset();
  };

  const handleLikePost = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleReportPost = (post: ExtendedForumPost) => {
    setPostToReport(post);
    setIsReportModalOpen(true);
  };

  const submitReport = () => {
    if (!postToReport || !reportReason.trim()) {
      toast({
        title: "Unable to submit report",
        description: "Please provide a reason for reporting this content.",
        variant: "destructive",
      });
      return;
    }

    reportPostMutation.mutate({
      postId: postToReport.id,
      reason: reportReason
    });
  };
  
  const toggleComments = async (postId: string) => {
    const currentState = showComments[postId] || false;
    
    setShowComments({
      ...showComments,
      [postId]: !currentState
    });
    
    // If we're showing comments and don't have the post selected yet
    if (!currentState && (!selectedPost || selectedPost.id !== postId)) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSelectedPost(post);
      }
    }
  };

  const handleCategoryFilter = (category: string | null) => {
    setCategoryFilter(category);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Community Forums</h2>
        <Button onClick={() => setIsNewPostModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
      
      {/* Category Filter - at the top of the page, sticky position */}
      <div className="sticky top-0 z-20 pt-2 pb-4 bg-background">
        <div className="bg-card shadow-md rounded-lg p-3 border">
          <div className="flex items-center mb-2">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={categoryFilter === null ? "default" : "outline"} 
              size="sm"
              onClick={() => handleCategoryFilter(null)}
              className="text-xs"
            >
              All
            </Button>
            {["General", "Stress Management", "Anxiety", "Depression", "Relationships", "Support", "Academic Stress", "Self-Care"].map(category => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {isLoadingPosts ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading forum posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <CardTitle className="text-xl mb-2">
              {categoryFilter ? `No Posts in "${categoryFilter}" Category` : "No Forum Posts Yet"}
            </CardTitle>
            <p className="text-muted-foreground mb-4">
              {categoryFilter 
                ? `There are no discussions in the ${categoryFilter} category yet.`
                : "Be the first to start a discussion in our community forum!"}
            </p>
            <div className="flex gap-2 justify-center">
              {categoryFilter && (
                <Button variant="outline" onClick={() => handleCategoryFilter(null)}>
                  View All Posts
                </Button>
              )}
              <Button onClick={() => setIsNewPostModalOpen(true)}>
                Create {categoryFilter ? `${categoryFilter} Post` : "First Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {post.user ? (
                      <>
                        {post.user.profileImage ? (
                          <img 
                            src={post.user.profileImage} 
                            alt={post.user.name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <span className="text-base font-medium text-primary">
                              {post.user.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{post.title}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-primary dark:text-primary">
                              {post.user.name}
                            </span>
                            <span className="mx-1.5">•</span>
                            <span className="capitalize">{post.user.role}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{post.title}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            Anonymous User
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a')}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="whitespace-pre-line">{post.content}</p>
              </CardContent>
              
              <CardFooter className="border-t p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleComments(post.id)}
                    className="text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
                    {showComments[post.id] ? (
                      <ArrowUp className="h-3.5 w-3.5 ml-2" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 ml-2" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id)}
                    className={post.hasLiked ? "text-primary" : "text-muted-foreground"}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${post.hasLiked ? "fill-primary" : ""}`} />
                    {post.likes?.length || 0} {(post.likes?.length || 0) === 1 ? "Like" : "Likes"}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReportPost(post)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
                
                <div className="flex items-center">
                  {post.category && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mr-2">
                      {post.category}
                    </span>
                  )}
                  
                  {(user?.role === "admin" || (post.user && user && post.user.id.toString() === user.id.toString())) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
              
              {showComments[post.id] && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="space-y-4">
                    <CommentsSection 
                      postId={post.id}
                      form={commentForm}
                      onSubmit={() => onCommentSubmit(post.id)}
                      isPending={createCommentMutation.isPending}
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* New Post Modal */}
      <Dialog open={isNewPostModalOpen} onOpenChange={setIsNewPostModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <Form {...postForm}>
            <form onSubmit={postForm.handleSubmit(onPostSubmit)} className="space-y-4">
              <FormField
                control={postForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for your post" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={postForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your thoughts, questions, or experiences..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={postForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Stress Management">Stress Management</SelectItem>
                        <SelectItem value="Anxiety">Anxiety</SelectItem>
                        <SelectItem value="Depression">Depression</SelectItem>
                        <SelectItem value="Relationships">Relationships</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                        <SelectItem value="Academic Stress">Academic Stress</SelectItem>
                        <SelectItem value="Self-Care">Self-Care</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={postForm.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Post anonymously
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewPostModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Report Post Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Please provide the reason for reporting this content. This will help moderators review it appropriately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="font-medium">{postToReport?.title}</p>
              <p className="mt-1 text-sm line-clamp-3 text-muted-foreground">
                {postToReport?.content}
              </p>
            </div>
            
            <Textarea
              placeholder="Explain why you're reporting this post..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReportModalOpen(false);
                setPostToReport(null);
                setReportReason("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitReport}
              disabled={!reportReason.trim() || reportPostMutation.isPending}
            >
              {reportPostMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}

interface CommentsSectionProps {
  postId: string;
  form: any;
  onSubmit: () => void;
  isPending: boolean;
}

function CommentsSection({ postId, form, onSubmit, isPending }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<ExtendedForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [commentToReport, setCommentToReport] = useState<ExtendedForumComment | null>(null);
  const [reportReason, setReportReason] = useState("");
  
  // Fetch comments for this post
  const { refetch } = useQuery<ExtendedForumComment[]>({
    queryKey: ["/api/forum/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/forum/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3
  });
  
  // Handle data changes with useEffect instead of query callbacks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/forum/posts/${postId}/comments`);
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        console.log("Comments loaded successfully:", data);
        setComments(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading comments:", error);
        setIsLoading(false);
        toast({
          title: "Error loading comments",
          description: "There was a problem loading comments. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [postId, toast]);
  
  // Like comment mutation with optimistic updates
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("POST", `/api/forum/comments/${commentId}/like`);
    },
    onMutate: async (commentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      
      // Snapshot the previous value
      const previousComments = [...comments];
      
      // Optimistically update to the new value
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          // Toggle the like status
          const hasLiked = !comment.hasLiked;
          const likesCount = hasLiked
            ? [...comment.likes, user!.id.toString()]
            : comment.likes.filter(id => id !== user!.id.toString());
          
          return {
            ...comment,
            hasLiked,
            likes: likesCount
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      return { previousComments };
    },
    onError: (error, _, context) => {
      // If the mutation fails, roll back
      if (context?.previousComments) {
        setComments(context.previousComments);
      }
      
      toast({
        title: "Failed to like comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch to make sure we're in sync with server
      refetch();
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/forum/comments/${commentId}`);
    },
    onMutate: async (commentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      
      // Snapshot the previous value
      const previousComments = [...comments];
      
      // Optimistically update by removing the comment
      const updatedComments = comments.filter(comment => comment.id !== commentId);
      setComments(updatedComments);
      
      return { previousComments };
    },
    onError: (error, _, context) => {
      // If the mutation fails, roll back
      if (context?.previousComments) {
        setComments(context.previousComments);
      }
      
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
      
      // Also update post comment count
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
    },
    onSettled: () => {
      // Always refetch to make sure we're in sync with server
      refetch();
    }
  });
  
  const handleLikeComment = (commentId: string) => {
    likeCommentMutation.mutate(commentId);
  };
  
  // Report comment mutation
  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason: string }) => {
      return apiRequest("POST", `/api/forum/comments/${commentId}/report`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      setIsReportModalOpen(false);
      setCommentToReport(null);
      setReportReason("");
      toast({
        title: "Comment reported",
        description: "Thank you for reporting this content. Admins will review it shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to report comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      deleteCommentMutation.mutate(commentId);
    }
  };
  
  const handleReportComment = (comment: ExtendedForumComment) => {
    setCommentToReport(comment);
    setIsReportModalOpen(true);
  };
  
  const submitCommentReport = () => {
    if (!commentToReport || !reportReason.trim()) {
      toast({
        title: "Unable to submit report",
        description: "Please provide a reason for reporting this content.",
        variant: "destructive",
      });
      return;
    }

    reportCommentMutation.mutate({
      commentId: commentToReport.id,
      reason: reportReason
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Comments</h3>
      
      {isLoading ? (
        <div className="py-4 text-center">
          <p>Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            if (comment.isDeleted) {
              // For deleted comments, show a simple non-interactive indicator
              return (
                <div key={comment.id} className="ml-8 bg-muted/20 p-3 rounded-lg border border-muted">
                  <p className="text-sm text-muted-foreground italic">{comment.content}</p>
                </div>
              );
            }
            
            // For normal comments, show the full interactive component
            return (
              <div key={comment.id} className="flex space-x-3">
                {comment.user ? (
                  <>
                    {comment.user.profileImage ? (
                      <img 
                        src={comment.user.profileImage} 
                        alt={comment.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {comment.user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-sm">
                            {comment.user.name}
                          </span>
                          <span className="mx-1.5 text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {comment.user.role}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`h-6 px-2 ${comment.hasLiked ? "text-primary" : "text-muted-foreground"}`}
                          >
                            <Heart className={`h-3.5 w-3.5 mr-1 ${comment.hasLiked ? "fill-primary" : ""}`} />
                            <span className="text-xs">{comment.likes?.length || 0}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportComment(comment)}
                            className="h-6 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </Button>
                        
                          {(user?.role === "admin" || (comment.user && user && comment.user.id.toString() === user.id.toString())) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 px-2 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-sm">
                            Anonymous User
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`h-6 px-2 ${comment.hasLiked ? "text-primary" : "text-muted-foreground"}`}
                          >
                            <Heart className={`h-3.5 w-3.5 mr-1 ${comment.hasLiked ? "fill-primary" : ""}`} />
                            <span className="text-xs">{comment.likes?.length || 0}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportComment(comment)}
                            className="h-6 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </Button>
                          
                          {user?.role === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 px-2 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
          }} 
          className="pt-4 border-t"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormControl>
                    <Textarea 
                      placeholder="Write a comment..."
                      className="min-h-[60px] resize-none flex-1"
                      {...field}
                    />
                  </FormControl>
                  <Button 
                    type="submit"
                    disabled={isPending || !field.value}
                    className="self-end"
                  >
                    Post
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-sm">
                  Comment anonymously
                </FormLabel>
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      {/* Report Comment Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this comment. This will be reviewed by administrators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Comment content:</p>
              <p className="text-sm">{commentToReport?.content}</p>
            </div>
            
            <Textarea
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={submitCommentReport}
              disabled={!reportReason.trim()}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
