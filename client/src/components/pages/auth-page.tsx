import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { z } from "zod";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    // If user is authenticated, redirect to home page
    if (user && !isLoading) {
      console.log("User logged in, redirecting to home page");
      setTimeout(() => {
        window.location.href = "/"; // Force hard redirect to homepage
      }, 100);
    }
  }, [user, isLoading]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "student",
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      // Submit the login request
      const result = await loginMutation.mutateAsync(data);
      console.log("Login successful, redirecting...");
      
      // Force the browser to do a hard redirect to the homepage
      window.location.href = "/";
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login failure here
    }
  };

  const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      // Submit the registration request
      const result = await registerMutation.mutateAsync(data);
      console.log("Registration successful, redirecting...");
      
      // Force the browser to do a hard redirect to the homepage
      window.location.href = "/";
    } catch (error) {
      console.error("Registration failed:", error);
      // Handle registration failure here
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#A8D4D0]">
      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog 
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
      />
      
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-900">CAPS Management System</h1>
          {/* Time display removed per user request */}
        </div>
        
        <div className="flex flex-col items-center justify-center mt-10">
          <h2 className="text-xl font-medium text-neutral-800 mb-1">Welcome to the Therapy Service Platform</h2>
          <p className="text-sm text-neutral-600 mb-8">Please sign in to continue or create a new account</p>
          
          <Card className="w-full max-w-md border border-amber-200 bg-[#F6E6C5]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-medium text-center">
                Welcome
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#A8D4D0]/20 border-border">
                  <TabsTrigger value="login" className="data-[state=active]:bg-[#A8D4D0]/40 rounded-md">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-[#A8D4D0]/40 rounded-md">Sign Up</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      {loginMutation.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {loginMutation.error.message ||
                              "Invalid username or password"}
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Username:</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Password:</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* "Remember me" option removed as requested */}

                      <Button
                        type="submit"
                        className="w-full bg-[#91C788] hover:bg-[#7eb37a] text-neutral-800 font-medium"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          "Signing In..."
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-4 text-center text-xs">
                    <p className="text-neutral-600">Don't have an account? <span className="text-[#95A97F] cursor-pointer hover:underline" onClick={() => setActiveTab("register")}>Sign up</span></p>
                  </div>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      {registerMutation.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {registerMutation.error.message ||
                              "Registration failed"}
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Full Name:</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full name"
                                className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Email:</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Username:</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Create a username"
                                className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-700">Password:</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-700">Confirm:</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm password"
                                  className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700">Role:</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8D4D0] focus-visible:ring-offset-2"
                                defaultValue="student"
                                {...field}
                              >
                                <option value="student">Student</option>
                                <option value="therapist">Therapist</option>
                                <option value="admin">Admin</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-[#91C788] hover:bg-[#7eb37a] text-neutral-800 font-medium"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          "Creating Account..."
                        ) : (
                          "Sign Up"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-4 text-center text-xs">
                    <p className="text-neutral-600">Already have an account? <span className="text-[#95A97F] cursor-pointer hover:underline" onClick={() => setActiveTab("login")}>Sign in</span></p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* We're no longer using a right column - the design has a centered single column layout */}
      </div>
    </div>
  );
}
