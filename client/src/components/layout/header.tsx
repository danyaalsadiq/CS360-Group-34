import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

// LiveClock component removed per user request

type HeaderProps = {
  setIsMobileOpen: (open: boolean) => void;
};

export function Header({ setIsMobileOpen }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (!user) return null;

  const getHeaderTitle = () => {
    return `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-[#A8D4D0] z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-neutral-700"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex flex-col justify-center">
              <h2 className="text-xl font-medium text-neutral-800">Welcome, {user.name.split(' ')[0]}!</h2>
              <p className="text-sm text-neutral-600">{getHeaderTitle()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time display removed per user request */}
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <Button
              variant="ghost"
              size="sm"
              className="bg-amber-100/50 hover:bg-amber-100 text-neutral-800 rounded-full border border-amber-200 px-3"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
