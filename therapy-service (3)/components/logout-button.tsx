"use client"

import { useRouter } from "next/navigation"
import { useUser } from "./user-context"

export function LogoutButton() {
  const router = useRouter()
  const { setUser } = useUser()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      // Clear local state and redirect
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-[#df7d7d] hover:bg-[#df7d7d]/80 rounded-full px-4 py-2 text-white font-medium"
    >
      Logout
    </button>
  )
}
