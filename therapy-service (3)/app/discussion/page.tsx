"use client"

import Link from "next/link"
import { Timer } from "@/components/timer"
import { useState } from "react"

interface ForumTopic {
  id: string
  title: string
  description: string
  author: string
  date: string
  views: number
  replies: number
}

const forumTopics: ForumTopic[] = [
  {
    id: "1",
    title: "Coping with Exam Stress",
    description: "I'm really struggling with the upcoming finals. Any tips on how to manage stress during exam season?",
    author: "Ahmed",
    date: "2 days ago",
    views: 89,
    replies: 13,
  },
  {
    id: "2",
    title: "Mindfulness Resources",
    description:
      "I've been practicing mindfulness and it's helped me a lot. Here are some resources that might help others too.",
    author: "Fatima",
    date: "1 week ago",
    views: 142,
    replies: 23,
  },
  {
    id: "3",
    title: "Dealing with Roommate Conflicts",
    description: "Having some issues with my roommate. How do you handle conflicts in shared living spaces?",
    author: "Omar",
    date: "3 days ago",
    views: 76,
    replies: 19,
  },
  {
    id: "4",
    title: "Self-care Routines",
    description:
      "What are your favorite self-care routines? I'm looking to establish better habits for my mental health.",
    author: "Ayesha",
    date: "5 days ago",
    views: 203,
    replies: 31,
  },
]

type FilterType = "recent" | "popular" | "unanswered"

export default function DiscussionForum() {
  const [filter, setFilter] = useState<FilterType>("recent")
  const currentDate = new Date()

  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xl mb-2">{currentDate.toLocaleTimeString()}</p>
        <p className="text-sm">{currentDate.toLocaleDateString()}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-lg hover:underline">← Back to Home</button>
            </Link>
            <h1 className="text-3xl">Discussion Forum</h1>
          </div>
          <Timer />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          <h2 className="text-2xl">Recent Topics</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("popular")}
              className={`px-4 py-1 rounded-full ${
                filter === "popular" ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-[#E4D7BE]/50"
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-1 rounded-full ${
                filter === "recent" ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-[#E4D7BE]/50"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setFilter("unanswered")}
              className={`px-4 py-1 rounded-full ${
                filter === "unanswered" ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-[#E4D7BE]/50"
              }`}
            >
              Unanswered
            </button>
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-6">
          {forumTopics.map((topic) => (
            <div key={topic.id} className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium">{topic.title}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span>{topic.views} 👁️</span>
                  <span>{topic.replies} 💬</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{topic.description}</p>
              <div className="flex justify-between items-center text-sm">
                <p>
                  Posted by <span className="font-medium">{topic.author}</span> • {topic.date}
                </p>
                <button className="bg-[#E4D7BE] hover:bg-[#E4D7BE]/80 border-2 border-[#DFB97D] px-4 py-1 rounded-full">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
