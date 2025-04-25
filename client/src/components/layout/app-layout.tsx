import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useLocation } from "wouter";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-y-auto bg-[#A8D4D0] p-4 md:p-6">
          {children}
        </main>
        
        {/* Chatbot popup removed as requested */}
      </div>
    </div>
  );
}
