import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  Calendar,
  CheckSquare,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  User,
  Menu,
  Star,
  Layout,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors group cursor-pointer",
          active
            ? "bg-[#FFF5E1] text-[#CD9746]"
            : "text-neutral-700 hover:bg-[#f0f0f0]"
        )}
        onClick={onClick}
      >
        <span className={cn("mr-3 h-5 w-5", active ? "text-[#CD9746]" : "text-neutral-500")}>{icon}</span>
        {label}
      </div>
    </Link>
  );
}

type SidebarProps = {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
};

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMenuOnMobile = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!user) return null;

  return (
    <div
      className={cn(
        "bg-white w-full md:w-64 flex-shrink-0 md:h-screen z-20 md:static fixed bottom-0 left-0 right-0 md:top-0 transform transition-transform duration-300 md:translate-y-0 shadow-md",
        isMobileOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
      )}
    >
      <div className="p-4 border-b flex justify-between items-center md:justify-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="bg-primary rounded-lg p-1">
              <Layout className="h-6 w-6 text-white" />
            </span>
            <span className="font-semibold text-xl md:block hidden">CAPS System</span>
          </div>
        </Link>
        
        <div className="flex md:hidden items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 md:flex hidden justify-between items-center">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-neutral-900">{user.name}</p>
            <div className="flex items-center">
              <span className="text-xs font-medium text-primary capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="p-2 md:h-[calc(100vh-10rem)]">
        {/* Student Navigation */}
        {user.role === "student" && (
          <>
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Main
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/" 
                  icon={<Home />} 
                  label="Dashboard" 
                  active={location === "/"} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/schedule" 
                  icon={<Calendar />} 
                  label="Weekly Schedule" 
                  active={location.includes("/schedule")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
            
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Support
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/chat" 
                  icon={<MessageSquare />} 
                  label="Website Assistant" 
                  active={location.includes("/chat")} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/forums" 
                  icon={<Users />} 
                  label="Forums" 
                  active={location.includes("/forums")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
          </>
        )}

        {/* Therapist Navigation */}
        {user.role === "therapist" && (
          <>
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Main
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/" 
                  icon={<Home />} 
                  label="Dashboard" 
                  active={location === "/"} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/schedule" 
                  icon={<Calendar />} 
                  label="Availability" 
                  active={location.includes("/schedule")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
            
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Communication
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/chat" 
                  icon={<MessageSquare />} 
                  label="Website Assistant" 
                  active={location.includes("/chat")} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/forums" 
                  icon={<Users />} 
                  label="Forums" 
                  active={location.includes("/forums")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
          </>
        )}

        {/* Admin Navigation */}
        {user.role === "admin" && (
          <>
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Main
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/admin" 
                  icon={<Shield />} 
                  label="Admin Dashboard" 
                  active={location === "/admin"} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/schedule" 
                  icon={<Calendar />} 
                  label="Calendar Management" 
                  active={location.includes("/schedule")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
            
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                System
              </h3>
              <div className="mt-2 space-y-1">
                <NavItem 
                  href="/chat" 
                  icon={<MessageSquare />} 
                  label="Website Assistant" 
                  active={location.includes("/chat")} 
                  onClick={closeMenuOnMobile}
                />
                <NavItem 
                  href="/forums" 
                  icon={<Users />} 
                  label="Forums" 
                  active={location.includes("/forums")} 
                  onClick={closeMenuOnMobile}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-6 mt-6 border-t">
          <div className="px-4 space-y-2">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start px-4 py-2 text-red-500 hover:bg-red-50"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-3 h-5 w-5" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
