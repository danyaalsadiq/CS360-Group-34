"use client"

import { useUser } from "@/components/user-context"
import { Timer } from "@/components/timer"
import { DailyQuote } from "@/components/daily-quote"
import Link from "next/link"
import { Calendar, Target, Users, MessageCircle } from "lucide-react"

export default function StudentDashboard() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  // Redirect if not student (this is a backup to the context redirects)
  if (user?.role !== "student") {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Access denied. Student account required.</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">Welcome, {user.name}</h1>
            <p className="text-gray-600">Student Dashboard</p>
          </div>
          <Timer />
        </div>

        <DailyQuote />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/student/sessions">
            <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 hover:shadow-lg transition-all flex items-center">
              <Calendar className="h-12 w-12 mr-4" />
              <div>
                <h2 className="text-xl font-bold">My Sessions</h2>
                <p className="text-gray-600">View and manage your therapy sessions</p>
              </div>
            </div>
          </Link>

          <Link href="/student/goals">
            <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 hover:shadow-lg transition-all flex items-center">
              <Target className="h-12 w-12 mr-4" />
              <div>
                <h2 className="text-xl font-bold">Health Goals</h2>
                <p className="text-gray-600">Track your progress and set new goals</p>
              </div>
            </div>
          </Link>

          <Link href="/discussion">
            <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 hover:shadow-lg transition-all flex items-center">
              <MessageCircle className="h-12 w-12 mr-4" />
              <div>
                <h2 className="text-xl font-bold">Discussion Forum</h2>
                <p className="text-gray-600">Connect with peers and share experiences</p>
              </div>
            </div>
          </Link>

          <Link href="/student/groups">
            <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 hover:shadow-lg transition-all flex items-center">
              <Users className="h-12 w-12 mr-4" />
              <div>
                <h2 className="text-xl font-bold">Group Sessions</h2>
                <p className="text-gray-600">Browse and join group therapy sessions</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <div>
                <h3 className="font-medium">Individual Therapy</h3>
                <p className="text-sm text-gray-600">With Dr. Sarah Ahmed</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Tomorrow</p>
                <p className="text-sm text-gray-600">10:00 AM - 11:00 AM</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <div>
                <h3 className="font-medium">Stress Management Group</h3>
                <p className="text-sm text-gray-600">8 participants</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Friday</p>
                <p className="text-sm text-gray-600">2:00 PM - 3:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
