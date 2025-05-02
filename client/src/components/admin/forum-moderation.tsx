import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  AlertTriangle,
  User,
  Clock,
  Trash2,
  CheckCircle,
  Search,
  MessageCircle,
  LayoutList,
  MessagesSquare
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  post: {
    id: string;
    title: string;
    content: string;
  };
};

export function ForumModeration() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("posts");
  
  // Posts-related state
  const [selectedPost, setSelectedPost] = useState<ExtendedForumPost | null>(null);
  const [isViewPostOpen, setIsViewPostOpen] = useState(false);
  
  // Comments-related state
  const [selectedComment, setSelectedComment] = useState<ExtendedForumComment | null>(null);
  const [isViewCommentOpen, setIsViewCommentOpen] = useState(false);
  
  // Shared state
  const [adminAction, setAdminAction] = useState<string>("");
  const [adminActionNote, setAdminActionNote] = useState<string>("");
  const [isAdminActionDialogOpen, setIsAdminActionDialogOpen] = useState(false);
  
  // Fetch reported forum posts
  const { 
    data: reportedPosts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery<ExtendedForumPost[]>({
    queryKey: ["/api/admin/forum/reported"],
    queryFn: () => apiRequest("GET", "/api/admin/forum/reported").then(res => res.json()),
    retry: 1,
  });
  
  // Fetch reported comments
  const { 
    data: reportedCommentsRaw = [], 
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useQuery<ExtendedForumComment[]>({
    queryKey: ["/api/admin/forum/reported-comments"],
    queryFn: () => apiRequest("GET", "/api/admin/forum/reported-comments").then(res => res.json()),
    retry: 1,
  });
  
  // Filter out deleted comments from the reported comments
  const reportedComments = reportedCommentsRaw.filter(comment => !comment.isDeleted);
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/forum/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forum/reported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsAdminActionDialogOpen(false);
      toast({
        title: "Post deleted",
        description: "The reported post has been deleted successfully.",
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

  // Approve post mutation
  const approvePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/admin/forum/posts/${postId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forum/reported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsAdminActionDialogOpen(false);
      toast({
        title: "Post approved",
        description: "The reported post has been marked as approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve post",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason?: string }) => {
      return apiRequest("DELETE", `/api/forum/comments/${commentId}?reason=${encodeURIComponent(reason || "")}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forum/reported-comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsAdminActionDialogOpen(false);
      toast({
        title: "Comment deleted",
        description: "The reported comment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("POST", `/api/admin/forum/comments/${commentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forum/reported-comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsAdminActionDialogOpen(false);
      toast({
        title: "Comment approved",
        description: "The reported comment has been marked as approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleViewPost = (post: ExtendedForumPost) => {
    setSelectedPost(post);
    setIsViewPostOpen(true);
  };

  const handleAdminAction = (post: ExtendedForumPost, action: string) => {
    setSelectedPost(post);
    setSelectedComment(null);
    setAdminAction(action);
    setAdminActionNote("");
    setIsAdminActionDialogOpen(true);
  };
  
  const handleViewComment = (comment: ExtendedForumComment) => {
    setSelectedComment(comment);
    setIsViewCommentOpen(true);
  };

  const handleCommentAction = (comment: ExtendedForumComment, action: string) => {
    setSelectedComment(comment);
    setSelectedPost(null);
    setAdminAction(action);
    setAdminActionNote("");
    setIsAdminActionDialogOpen(true);
  };

  const confirmAdminAction = () => {
    if (selectedTab === "posts" && selectedPost) {
      if (adminAction === "delete") {
        deletePostMutation.mutate(selectedPost.id);
      } else if (adminAction === "approve") {
        approvePostMutation.mutate(selectedPost.id);
      }
    } else if (selectedTab === "comments" && selectedComment) {
      if (adminAction === "delete") {
        deleteCommentMutation.mutate({
          commentId: selectedComment.id,
          reason: adminActionNote
        });
      } else if (adminAction === "approve") {
        approveCommentMutation.mutate(selectedComment.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="posts" 
        className="w-full"
        onValueChange={(value) => setSelectedTab(value)}
        value={selectedTab}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="posts" className="flex items-center">
            <LayoutList className="mr-2 h-4 w-4" />
            Reported Posts
            {reportedPosts.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {reportedPosts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center">
            <MessagesSquare className="mr-2 h-4 w-4" />
            Reported Comments
            {reportedComments.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {reportedComments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold tracking-tight">Reported Posts</h2>
          </div>
          
          {isLoadingPosts ? (
            <div className="flex justify-center items-center h-48">
              <p>Loading reported posts...</p>
            </div>
          ) : reportedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <CardTitle className="text-xl mb-2">No Reported Posts</CardTitle>
                <p className="text-muted-foreground mb-4">
                  There are currently no reported posts that require moderation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reportedPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
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
                              <div className="flex items-center">
                                <CardTitle className="text-base">{post.title}</CardTitle>
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                                  Reported
                                </span>
                              </div>
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
                              <div className="flex items-center">
                                <CardTitle className="text-base">{post.title}</CardTitle>
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                                  Reported
                                </span>
                              </div>
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
                    <div className="mb-3">
                      <p className="font-semibold text-sm">Report Reason:</p>
                      <p className="text-sm bg-red-100 dark:bg-red-950/30 p-2 rounded mt-1 text-red-800 dark:text-red-200">
                        {post.reportReason || "No reason provided"}
                      </p>
                    </div>
                    <p className="line-clamp-3 mt-3">{post.content}</p>
                  </CardContent>
                  
                  <CardFooter className="border-t p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPost(post)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.commentCount || 0} {post.commentCount === 1 ? "Comment" : "Comments"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleAdminAction(post, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleAdminAction(post, "delete")}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold tracking-tight">Reported Comments</h2>
          </div>
          
          {isLoadingComments ? (
            <div className="flex justify-center items-center h-48">
              <p>Loading reported comments...</p>
            </div>
          ) : reportedComments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <CardTitle className="text-xl mb-2">No Reported Comments</CardTitle>
                <p className="text-muted-foreground mb-4">
                  There are currently no reported comments that require moderation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reportedComments.map((comment) => (
                <Card key={comment.id} className="overflow-hidden border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {comment.user ? (
                          <>
                            {comment.user.profileImage ? (
                              <img 
                                src={comment.user.profileImage} 
                                alt={comment.user.name}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <span className="text-base font-medium text-primary">
                                  {comment.user.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center">
                                <CardTitle className="text-base">Comment on: {comment.post.title}</CardTitle>
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                                  Reported
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <span className="font-medium text-primary dark:text-primary">
                                  {comment.user.name}
                                </span>
                                <span className="mx-1.5">•</span>
                                <span className="capitalize">{comment.user.role}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mr-3">
                              <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <CardTitle className="text-base">Comment on: {comment.post.title}</CardTitle>
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                                  Reported
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Anonymous User
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-3">
                      <p className="font-semibold text-sm">Report Reason:</p>
                      <p className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded mt-1 text-red-800 dark:text-red-200">
                        {comment.reportReason || "No reason provided"}
                      </p>
                    </div>
                    
                    <div className="mt-3 p-3 border rounded-md bg-red-50 dark:bg-red-900/10">
                      <p className="font-semibold text-sm mb-2">Reported Comment:</p>
                      <p className="text-sm text-red-800 dark:text-red-200">{comment.content}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewComment(comment)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        View in Context
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleCommentAction(comment, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCommentAction(comment, "delete")}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* View Post Details Dialog */}
      <Dialog open={isViewPostOpen} onOpenChange={setIsViewPostOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Posted by {selectedPost?.user?.name || "Anonymous User"} on {selectedPost && format(new Date(selectedPost.createdAt), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedPost?.content}</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                Report Information
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium mb-1">Reason for report:</p>
                <p className="text-sm">{selectedPost?.reportReason || "No reason provided"}</p>
                
                <p className="text-sm font-medium mt-3 mb-1">Reported by:</p>
                <p className="text-sm">User #{selectedPost?.reportedBy}</p>
                
                <p className="text-sm font-medium mt-3 mb-1">Reported on:</p>
                <p className="text-sm">{selectedPost?.updatedAt && format(new Date(selectedPost.updatedAt), 'MMMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsViewPostOpen(false)}
            >
              Close
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setIsViewPostOpen(false);
                  if (selectedPost) handleAdminAction(selectedPost, "approve");
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => {
                  setIsViewPostOpen(false);
                  if (selectedPost) handleAdminAction(selectedPost, "delete");
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Comment Details Dialog */}
      <Dialog open={isViewCommentOpen} onOpenChange={setIsViewCommentOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Comment in context</DialogTitle>
            <DialogDescription>
              Comment by {selectedComment?.user?.name || "Anonymous User"} on {selectedComment && format(new Date(selectedComment.createdAt), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-base font-semibold mb-2">Post: {selectedComment?.post.title}</h3>
              <div className="bg-muted/30 p-4 rounded-md mb-4">
                <p className="line-clamp-3">{selectedComment?.post.content}</p>
              </div>
              
              <div className="border-l-4 border-l-red-500 pl-4 py-2 bg-red-50 dark:bg-red-950/20 rounded-r-md">
                <h4 className="text-sm font-semibold mb-2 text-red-800 dark:text-red-200">Reported Comment:</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedComment?.content}</p>
              </div>
            </div>
            
            <div>
              <p className="font-semibold mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                Report Information
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium mb-1">Reason for report:</p>
                <p className="text-sm">{selectedComment?.reportReason || "No reason provided"}</p>
                
                <p className="text-sm font-medium mt-3 mb-1">Reported by:</p>
                <p className="text-sm">User #{selectedComment?.reportedBy}</p>
                
                <p className="text-sm font-medium mt-3 mb-1">Reported on:</p>
                <p className="text-sm">{selectedComment?.updatedAt && format(new Date(selectedComment.updatedAt), 'MMMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsViewCommentOpen(false)}
            >
              Close
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setIsViewCommentOpen(false);
                  if (selectedComment) handleCommentAction(selectedComment, "approve");
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => {
                  setIsViewCommentOpen(false);
                  if (selectedComment) handleCommentAction(selectedComment, "delete");
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Admin Action Confirmation Dialog */}
      <Dialog open={isAdminActionDialogOpen} onOpenChange={setIsAdminActionDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {adminAction === "delete" ? 
                (selectedTab === "posts" ? "Delete Reported Post" : "Delete Reported Comment") : 
                (selectedTab === "posts" ? "Approve Reported Post" : "Approve Reported Comment")}
            </DialogTitle>
            <DialogDescription>
              {adminAction === "delete" 
                ? (selectedTab === "posts" ? 
                  "This will permanently remove the post and all associated comments from the forums." : 
                  "This will permanently remove the comment from the post.")
                : (selectedTab === "posts" ? 
                  "This will mark the post as approved and remove the reported status." : 
                  "This will mark the comment as approved and remove the reported status.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              {selectedTab === "posts" ? (
                <>
                  <p className="font-medium">{selectedPost?.title}</p>
                  <p className="mt-1 text-sm line-clamp-3 text-muted-foreground">
                    {selectedPost?.content}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Comment on: {selectedComment?.post?.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground bg-red-50/50 dark:bg-red-950/10 p-2 rounded">
                    {selectedComment?.content}
                  </p>
                </>
              )}
            </div>
            
            <Textarea
              placeholder={adminAction === "delete" 
                ? "Optional: Add notes about why this is being deleted..." 
                : "Optional: Add notes about approving this content..."}
              value={adminActionNote}
              onChange={(e) => setAdminActionNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdminActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant={adminAction === "delete" ? "destructive" : "default"}
              onClick={confirmAdminAction}
              disabled={
                (selectedTab === "posts" && (deletePostMutation.isPending || approvePostMutation.isPending)) ||
                (selectedTab === "comments" && (deleteCommentMutation.isPending || approveCommentMutation.isPending))
              }
            >
              {adminAction === "delete" 
                ? (selectedTab === "posts" ? 
                  (deletePostMutation.isPending ? "Deleting..." : "Delete Post") : 
                  (deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment")) 
                : (selectedTab === "posts" ? 
                  (approvePostMutation.isPending ? "Approving..." : "Approve Post") : 
                  (approveCommentMutation.isPending ? "Approving..." : "Approve Comment"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}