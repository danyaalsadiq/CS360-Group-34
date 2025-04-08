"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { initializeAuth } from "@/lib/auth"

type User = {
  id: string
  email: string
  name: string
  role: "therapist" | "admin" | "student"
}

type UserContextType = {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  signOut: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const PUBLIC_PATHS = ["/auth"]

// Define role-specific home pages
const ROLE_HOME_PAGES = {
  admin: "/admin",
  student: "/student",
  therapist: "/",
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth system with default user if needed
  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }

    setLoading(false)
  }, [])

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
      localStorage.removeItem("rememberMe") // Clear remember me flag on logout
    }
  }, [user])

  // Handle authentication redirects
  useEffect(() => {
    if (!loading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname || "")

      if (!user && !isPublicPath) {
        router.push("/auth")
      } else if (user && isPublicPath) {
        // Redirect to role-specific home page
        const homePage = ROLE_HOME_PAGES[user.role] || "/"
        router.push(homePage)
      }
    }
  }, [user, loading, pathname, router])

  const signOut = () => {
    setUser(null)
    router.push("/auth")
  }

  return <UserContext.Provider value={{ user, setUser, loading, signOut }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
