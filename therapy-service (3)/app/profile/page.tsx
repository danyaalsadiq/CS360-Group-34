"use client"

import { useState } from "react"
import { useUser } from "@/components/user-context"
import { Timer } from "@/components/timer"
import { updateUserProfile } from "@/lib/auth"
import { User, Edit2, Save, X } from "lucide-react"

export default function ProfilePage() {
  const { user, setUser, loading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty")
      return
    }

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const updatedUser = await updateUserProfile(user.id, { name })
      setUser({
        ...user,
        name: updatedUser.name,
      })
      setIsEditing(false)
      setSuccess("Profile updated successfully")
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setName(user.name)
    setIsEditing(false)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Timer />
        </div>

        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-[#DFB97D] rounded-full p-4 mr-4">
                <User size={40} />
              </div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-[#BBE0E5] hover:bg-[#BBE0E5]/80 px-4 py-2 rounded-full"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
          )}

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DFB97D]"
                />
              ) : (
                <p className="font-medium">{user.name}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Account Created</p>
              <p className="font-medium">March 6, 2025</p>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full"
                  disabled={isSaving}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-[#a1df7d] hover:bg-[#a1df7d]/80 px-4 py-2 rounded-full"
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
