import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatPopup } from "@/components/chat/chat-popup";
import { useLocation } from "wouter";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  
  // Don't show the chat popup on the dedicated chat page
  const showChatPopup = !location.includes("/chat");

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-y-auto bg-[#A8D4D0] p-4 md:p-6">
          {children}
        </main>
        
        {/* Add chat popup for all pages except the dedicated chat page */}
        {showChatPopup && <ChatPopup />}
      </div>
    </div>
  );
}
