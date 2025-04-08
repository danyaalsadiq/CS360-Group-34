"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, Users, ChevronLeft, FileText, MessageSquare, User } from "lucide-react"
import { Timer } from "@/components/timer"
import { useUser } from "@/components/user-context"
import type { TherapyRoom, TherapySession } from "@/types/therapy-types"

// Mock data for group therapy rooms
const mockRooms: TherapyRoom[] = [
  {
    id: "1",
    name: "Stress Management",
    description: "Learn techniques to manage academic stress and anxiety.",
    schedule: "Weekly",
    time: "Mondays, 4:00 PM - 5:30 PM",
    therapist: "Dr. Sarah Ahmed",
    participants: 8,
    maxParticipants: 12,
    isPrivate: false,
    topics: ["Stress", "Anxiety", "Academic Pressure"],
  },
  {
    id: "2",
    name: "Mindfulness Meditation",
    description: "Practice mindfulness techniques for improved mental well-being.",
    schedule: "Weekly",
    time: "Wednesdays, 5:00 PM - 6:00 PM",
    therapist: "Dr. Ali Hassan",
    participants: 10,
    maxParticipants: 15,
    isPrivate: false,
    topics: ["Mindfulness", "Meditation", "Relaxation"],
  },
  {
    id: "3",
    name: "Grief Support Group",
    description: "A safe space to process grief and loss with others who understand.",
    schedule: "Bi-weekly",
    time: "Thursdays, 3:00 PM - 4:30 PM",
    therapist: "Dr. Amina Khan",
    participants: 6,
    maxParticipants: 10,
    isPrivate: true,
    topics: ["Grief", "Loss", "Emotional Support"],
  },
  {
    id: "4",
    name: "Social Anxiety Workshop",
    description: "Develop skills to manage social anxiety and build confidence.",
    schedule: "Weekly",
    time: "Tuesdays, 2:00 PM - 3:30 PM",
    therapist: "Dr. Sarah Ahmed",
    participants: 7,
    maxParticipants: 12,
    isPrivate: false,
    topics: ["Social Anxiety", "Confidence Building", "Communication Skills"],
  },
]

// Mock sessions data
const mockSessions: TherapySession[] = [
  {
    id: "s1",
    roomId: "1",
    date: new Date(2025, 2, 10), // March 10, 2025
    startTime: "4:00 PM",
    endTime: "5:30 PM",
    title: "Introduction to Stress Management",
    description: "First session introducing key concepts and techniques.",
    attendees: ["Student 1", "Student 2", "Student 3", "Student 4", "Student 5"],
    maxAttendees: 12,
    status: "scheduled",
  },
  {
    id: "s2",
    roomId: "1",
    date: new Date(2025, 2, 17), // March 17, 2025
    startTime: "4:00 PM",
    endTime: "5:30 PM",
    title: "Identifying Stress Triggers",
    description: "Learning to identify personal stress triggers and patterns.",
    attendees: ["Student 1", "Student 2", "Student 3", "Student 6", "Student 7"],
    maxAttendees: 12,
    status: "scheduled",
  },
  {
    id: "s3",
    roomId: "4",
    date: new Date(2025, 2, 11), // March 11, 2025
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    title: "Understanding Social Anxiety",
    description: "Introduction to social anxiety and its impact.",
    attendees: ["Student 8", "Student 9", "Student 10", "Student 11"],
    maxAttendees: 12,
    status: "scheduled",
  },
]

interface PageProps {
  params: {
    id: string
  }
}

export default function RoomDetailsPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()
  const { user, loading } = useUser()
  const [room, setRoom] = useState<TherapyRoom | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [isJoined, setIsJoined] = useState(false)

  // Load room data
  useEffect(() => {
    // In a real app, this would be an API call
    const foundRoom = mockRooms.find((r) => r.id === id)

    if (foundRoom) {
      setRoom(foundRoom)

      // Check if room is private and user is not the therapist
      if (foundRoom.isPrivate && !loading && user && user.name !== foundRoom.therapist) {
        // Redirect if private room and not the therapist
        router.push("/group-therapy")
      }

      // Simulate if user has already joined
      setIsJoined(Math.random() > 0.5)
    } else {
      // Room not found
      router.push("/group-therapy")
    }
  }, [id, router, user, loading])

  // Load sessions
  useEffect(() => {
    if (room) {
      // In a real app, this would be an API call
      const roomSessions = mockSessions.filter((s) => s.roomId === room.id)
      setSessions(roomSessions)
    }
  }, [room])

  const handleJoinGroup = () => {
    // In a real app, this would be an API call
    setIsJoined(true)

    // Update participant count
    if (room) {
      setRoom({
        ...room,
        participants: room.participants + 1,
      })
    }
  }

  const handleLeaveGroup = () => {
    // In a real app, this would be an API call
    setIsJoined(false)

    // Update participant count
    if (room && room.participants > 0) {
      setRoom({
        ...room,
        participants: room.participants - 1,
      })
    }
  }

  if (loading || !room) {
    return (
      <main className="min-h-screen p-8 bg-[#BBE0E5]">
        <div className="flex justify-center items-center h-64">
          <div className="text-2xl">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-[#BBE0E5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/group-therapy">
            <button className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-full px-6 py-2 font-medium hover:shadow-lg transition-all flex items-center">
              <ChevronLeft className="mr-1" size={18} />
              Back to Group Therapy
            </button>
          </Link>
          <h1 className="text-3xl font-bold">Group Details</h1>
          <Timer />
        </div>

        {/* Room Details */}
        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{room.name}</h2>
              <p className="text-gray-700 mb-4">{room.description}</p>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2" size={16} />
                  <span>{room.schedule}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-2" size={16} />
                  <span>{room.time}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="mr-2" size={16} />
                  <span>Led by {room.therapist}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="mr-2" size={16} />
                  <span>
                    {room.participants}/{room.maxParticipants} Participants
                  </span>
                  <span className="ml-2 inline-block w-24 h-2 bg-gray-200 rounded-full">
                    <span
                      className="inline-block h-full bg-[#a1df7d] rounded-full"
                      style={{ width: `${(room.participants / room.maxParticipants) * 100}%` }}
                    ></span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {room.topics.map((topic, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded-full text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:w-64 flex flex-col justify-center">
              {isJoined ? (
                <div className="text-center">
                  <div className="bg-green-100 text-green-800 rounded-lg p-3 mb-4">You are a member of this group</div>
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full bg-[#df7d7d] hover:bg-[#df7d7d]/80 rounded-xl py-3 px-8 text-center font-medium transition-all"
                  >
                    Leave Group
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {room.participants < room.maxParticipants ? (
                    <button
                      onClick={handleJoinGroup}
                      className="w-full bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-3 px-8 text-center font-medium transition-all"
                    >
                      Join Group
                    </button>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 rounded-lg p-3">This group is currently full</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl overflow-hidden mb-8">
          <div className="bg-[#E4D7BE] border-b-2 border-[#DFB97D] p-4">
            <h3 className="text-xl font-bold">Upcoming Sessions</h3>
          </div>

          <div className="p-6">
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold">{session.title}</h4>
                        <p className="text-sm text-gray-600">{session.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {session.date.toLocaleDateString()} • {session.startTime} - {session.endTime}
                        </p>
                        <p className="text-sm">
                          {session.attendees.length}/{session.maxAttendees} Attendees
                        </p>
                      </div>
                    </div>

                    {isJoined && (
                      <div className="flex justify-end gap-2 mt-4">
                        <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                          <FileText size={14} className="mr-1" />
                          Materials
                        </button>
                        <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 px-3 py-1 rounded-full text-sm">
                          RSVP
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming sessions scheduled yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Group Discussion */}
        {isJoined && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-[#E4D7BE] border-b-2 border-[#DFB97D] p-4">
              <h3 className="text-xl font-bold">Group Discussion</h3>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">Connect with other group members</p>
              <button className="bg-[#E4D7BE] hover:bg-[#E4D7BE]/80 border-2 border-[#DFB97D] rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center mx-auto">
                <MessageSquare size={18} className="mr-1" />
                Open Discussion Board
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
