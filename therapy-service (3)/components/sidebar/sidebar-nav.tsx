"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Target, Users, MessageCircle, Bell, Settings, User } from "lucide-react"
import { useUser } from "@/components/user-context"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useUser()

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        href: user?.role === "admin" ? "/admin" : user?.role === "student" ? "/student" : "/",
        icon: Home,
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User,
      },
    ]

    // Add role-specific menu items
    if (user?.role === "therapist") {
      return [
        ...baseItems,
        {
          title: "Appointments",
          href: "/appointments",
          icon: Calendar,
        },
        {
          title: "Group Therapy",
          href: "/group-therapy",
          icon: Users,
        },
        {
          title: "Discussion",
          href: "/discussion",
          icon: MessageCircle,
        },
      ]
    } else if (user?.role === "student") {
      return [
        ...baseItems,
        {
          title: "My Sessions",
          href: "/student/sessions",
          icon: Calendar,
        },
        {
          title: "Health Goals",
          href: "/student/goals",
          icon: Target,
        },
        {
          title: "Discussion",
          href: "/discussion",
          icon: MessageCircle,
        },
      ]
    } else if (user?.role === "admin") {
      return [
        ...baseItems,
        {
          title: "Users",
          href: "/admin/users",
          icon: Users,
        },
        {
          title: "Reports",
          href: "/admin/reports",
          icon: Target,
        },
        {
          title: "Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-semibold tracking-tight">CAPS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="relative">
              <Bell className="mr-3 h-5 w-5" />
              <span>Notifications</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#df7d7d] text-xs text-white">
                1
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
