import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function TherapistDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Only showing Website Assistant as requested */}
      <div className="max-w-md mx-auto mb-8">
        {/* AI Chat Card */}
        <Card className="bg-white overflow-hidden rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Website Assistant</h3>
              <p className="text-sm text-neutral-600 mb-4">Get help navigating the platform</p>
              <div className="flex items-center justify-between">
                <div className="bg-[#E7F4F3] rounded-full px-3 py-1 text-sm text-[#417772]">
                  Available 24/7
                </div>
                <MessageSquare className="h-10 w-10 text-[#417772]" />
              </div>
            </div>
            <div className="bg-[#FFF5E1] px-5 py-3 border-t border-[#F0EEEB]">
              <Link href="/chat">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center bg-white hover:bg-[#F8F8F8] text-[#417772] font-medium rounded-full px-4 py-2 shadow-sm"
                >
                  Start Chat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
