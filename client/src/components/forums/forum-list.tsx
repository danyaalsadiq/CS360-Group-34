import { useState } from "react";
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
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  MessageCircle,
  Plus,
  User,
  Clock,
  AlertCircle,
  ArrowDown,
  ArrowUp
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

type ExtendedForumPost = ForumPost & {
  user: { 
    id: number; 
    name: string; 
    role: string;
    profileImage?: string;
  } | null;
  commentCount: number;
};

type ExtendedForumComment = ForumComment & {
  user: { 
    id: number; 
    name: string; 
    role: string;
    profileImage?: string;
  } | null;
};

const postFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
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
  const [selectedPost, setSelectedPost] = useState<ExtendedForumPost | null>(null);
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});
  
  // Fetch forum posts
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery<ExtendedForumPost[]>({
    queryKey: ["/api/forum/posts"],
    enabled: !!user
  });
  
  // Fetch comments for a specific post
  const fetchComments = async (postId: number) => {
    const { data } = await useQuery<ExtendedForumComment[]>({
      queryKey: ["/api/forum/posts", postId, "comments"],
      enabled: !!selectedPost && selectedPost.id === postId
    });
    
    return data || [];
  };
  
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
      postId: number; 
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
  
  // Post form
  const postForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
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
  
  const onCommentSubmit = (postId: number) => {
    const data = commentForm.getValues();
    createCommentMutation.mutate({ postId, data });
    commentForm.reset();
  };
  
  const toggleComments = async (postId: number) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Community Forums</h2>
        <Button onClick={() => setIsNewPostModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
      
      {isLoadingPosts ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading forum posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <CardTitle className="text-xl mb-2">No Forum Posts Yet</CardTitle>
            <p className="text-muted-foreground mb-4">
              Be the first to start a discussion in our community forum!
            </p>
            <Button onClick={() => setIsNewPostModalOpen(true)}>
              Create First Post
            </Button>
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
    </div>
  );
}

interface CommentsSectionProps {
  postId: number;
  form: any;
  onSubmit: () => void;
  isPending: boolean;
}

function CommentsSection({ postId, form, onSubmit, isPending }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ExtendedForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch comments for this post
  useQuery<ExtendedForumComment[]>({
    queryKey: ["/api/forum/posts", postId, "comments"],
    onSuccess: (data) => {
      setComments(data);
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });
  
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
          {comments.map((comment) => (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
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
    </div>
  );
}
