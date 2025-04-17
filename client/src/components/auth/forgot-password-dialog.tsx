import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
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
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      const result = await res.json();
      
      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Password reset email sent",
          description: "If an account with that email exists, you'll receive reset instructions shortly.",
        });
      } else {
        throw new Error(result.message || "Failed to send password reset email");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      toast({
        title: "Request failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setIsSuccess(false);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#F6E6C5] border-amber-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Forgot Your Password?</DialogTitle>
          <DialogDescription className="text-neutral-600">
            Enter your email address and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6">
            <Alert className="bg-[#91C788]/20 border-[#91C788] text-neutral-800">
              <Check className="h-4 w-4 text-[#91C788]" />
              <AlertTitle>Email Sent</AlertTitle>
              <AlertDescription>
                If an account with that email exists, you'll receive reset instructions shortly.
              </AlertDescription>
            </Alert>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button
                  className="w-full bg-[#91C788] hover:bg-[#7eb37a] text-neutral-800 font-medium"
                >
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="bg-white border-amber-100 focus-visible:ring-[#A8D4D0]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-[#A8D4D0] text-neutral-700 hover:bg-[#A8D4D0]/10"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#91C788] hover:bg-[#7eb37a] text-neutral-800 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}