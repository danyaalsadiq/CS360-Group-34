"use client"

import { LogOut } from "lucide-react"
import { useUser } from "@/components/user-context"

export function SignOutButton() {
  const { signOut } = useUser()

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 bg-[#E4D7BE] hover:bg-[#E4D7BE]/80 border-2 border-[#DFB97D] rounded-full px-4 py-2 font-medium transition-all"
    >
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  )
}
