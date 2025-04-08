"use client"

import { useUser } from "@/components/user-context"
import { Timer } from "@/components/timer"
import { DailyQuote } from "@/components/daily-quote"
import Link from "next/link"

export default function Home() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#BBE0E5] p-8 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">{`Greetings, ${user?.name || "Therapist"}`}</h1>
            <p className="text-gray-600">Here's an overview of your day</p>
          </div>
          <Timer />
        </div>

        <DailyQuote />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
          {/* Left Column - Navigation Buttons */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/calendar" className="block">
              <div className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-xl p-4 text-center hover:shadow-lg transition-all">
                <div className="text-3xl font-bold">Calendar</div>
              </div>
            </Link>

            <Link href="/group-therapy" className="block">
              <div className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-xl p-4 text-center hover:shadow-lg transition-all">
                <div className="text-3xl font-bold">Group Therapy</div>
                <div className="text-3xl font-bold">Rooms</div>
              </div>
            </Link>

            <Link href="/discussion" className="block">
              <div className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-xl p-4 text-center hover:shadow-lg transition-all">
                <div className="text-3xl font-bold">Discussion</div>
                <div className="text-3xl font-bold">Forum</div>
              </div>
            </Link>
          </div>

          {/* Center Column - Upcoming Meetings */}
          <div className="md:col-span-5">
            <div className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-xl p-8">
              <h2 className="text-2xl font-bold underline mb-6 text-center">Upcoming Meetings</h2>

              <div className="space-y-4">
                <p>
                  <span className="font-medium">Student Name:</span> ________________
                </p>
                <p>
                  <span className="font-medium">Roll Number:</span> ____-__-____
                </p>
                <p>
                  <span className="font-medium">From:</span> 10:00 am — <span className="font-medium">Till:</span> 11:00
                  pm
                </p>
                <p>
                  <span className="font-medium">Status:</span> Disturbed
                </p>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button className="bg-[#df7d7d] hover:bg-[#df7d7d]/80 rounded-xl py-3 px-8 text-center text-xl font-medium transition-all">
                  Cancel
                </button>
                <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-3 px-8 text-center text-xl font-medium transition-all">
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Timer */}
          <div className="md:col-span-3">
            <div className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-full aspect-square flex items-center justify-center p-4 max-w-[200px] mx-auto">
              <Timer />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
