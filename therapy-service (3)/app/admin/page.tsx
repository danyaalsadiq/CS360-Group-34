"use client"

import { useUser } from "@/components/user-context"
import { Timer } from "@/components/timer"

export default function AdminDashboard() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  // Redirect if not admin (this is a backup to the context redirects)
  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Access denied. Admin privileges required.</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <Timer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-2">Users</h2>
            <div className="text-3xl font-bold">24</div>
            <p className="text-sm text-gray-600">3 new this week</p>
          </div>

          <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-2">Sessions</h2>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-gray-600">32 this week</p>
          </div>

          <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-2">Groups</h2>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-gray-600">2 active now</p>
          </div>
        </div>

        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Authentication Service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Notification Service</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Degraded</span>
            </div>
          </div>
        </div>

        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-gray-600">New therapist account created</p>
              <span className="text-sm text-gray-500">10 minutes ago</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-gray-600">System backup completed</p>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <p className="text-gray-600">Weekly report generated</p>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
