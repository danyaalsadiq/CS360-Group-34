"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  UserPlus,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Timer } from "@/components/timer"
import { useUser } from "@/components/user-context"
import type { TherapyRoom, TherapySession, Participant } from "@/types/therapy-types"

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

// Mock participants data
const mockParticipants: Participant[] = [
  {
    id: "p1",
    name: "Ahmed Khan",
    email: "ahmed.khan@example.com",
    joinDate: new Date(2025, 1, 15),
    attendance: [
      { sessionId: "s1", attended: true },
      { sessionId: "s2", attended: false },
    ],
  },
  {
    id: "p2",
    name: "Fatima Ali",
    email: "fatima.ali@example.com",
    joinDate: new Date(2025, 1, 20),
    attendance: [
      { sessionId: "s1", attended: true },
      { sessionId: "s2", attended: true },
    ],
  },
  {
    id: "p3",
    name: "Omar Farooq",
    email: "omar.farooq@example.com",
    joinDate: new Date(2025, 2, 1),
    attendance: [
      { sessionId: "s1", attended: false },
      { sessionId: "s2", attended: true },
    ],
  },
  {
    id: "p4",
    name: "Zainab Malik",
    email: "zainab.malik@example.com",
    joinDate: new Date(2025, 2, 5),
    attendance: [{ sessionId: "s3", attended: true }],
  },
]

interface PageProps {
  params: {
    id: string
  }
}

export default function ManageRoomPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()
  const { user, loading } = useUser()
  const [room, setRoom] = useState<TherapyRoom | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [activeTab, setActiveTab] = useState<"sessions" | "participants" | "materials">("sessions")

  // Load room data
  useEffect(() => {
    // In a real app, this would be an API call
    const foundRoom = mockRooms.find((r) => r.id === id)

    if (foundRoom) {
      setRoom(foundRoom)

      // Check if current user is the room's therapist
      if (!loading && user && user.name !== foundRoom.therapist) {
        // Redirect if not authorized
        router.push("/group-therapy")
      }
    } else {
      // Room not found
      router.push("/group-therapy")
    }
  }, [id, router, user, loading])

  // Load sessions and participants
  useEffect(() => {
    if (room) {
      // In a real app, these would be API calls
      const roomSessions = mockSessions.filter((s) => s.roomId === room.id)
      setSessions(roomSessions)

      // Get participants who attended any of this room's sessions
      const sessionIds = roomSessions.map((s) => s.id)
      const roomParticipants = mockParticipants.filter((p) =>
        p.attendance.some((a) => sessionIds.includes(a.sessionId)),
      )
      setParticipants(roomParticipants)
    }
  }, [room])

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
          <h1 className="text-3xl font-bold">Manage Room</h1>
          <Timer />
        </div>

        {/* Room Details */}
        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{room.name}</h2>
              <p className="text-gray-700 mb-4">{room.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2" size={16} />
                    <span>{room.schedule}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2" size={16} />
                    <span>{room.time}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Users className="mr-2" size={16} />
                    <span>
                      {room.participants}/{room.maxParticipants} Participants
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
            </div>

            <div className="flex space-x-2">
              <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <Edit size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-6 py-3 font-medium ${
                activeTab === "sessions" ? "bg-[#E4D7BE] border-b-2 border-[#DFB97D]" : ""
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`px-6 py-3 font-medium ${
                activeTab === "participants" ? "bg-[#E4D7BE] border-b-2 border-[#DFB97D]" : ""
              }`}
            >
              Participants
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`px-6 py-3 font-medium ${
                activeTab === "materials" ? "bg-[#E4D7BE] border-b-2 border-[#DFB97D]" : ""
              }`}
            >
              Materials
            </button>
          </div>

          <div className="p-6">
            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Upcoming Sessions</h3>
                  <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center">
                    <Plus size={18} className="mr-1" />
                    Schedule Session
                  </button>
                </div>

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

                        <div className="flex justify-end gap-2 mt-4">
                          <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                            <FileText size={14} className="mr-1" />
                            Materials
                          </button>
                          <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                            <Users size={14} className="mr-1" />
                            Attendance
                          </button>
                          <button className="bg-[#E4D7BE] hover:bg-[#E4D7BE]/80 border border-[#DFB97D] px-3 py-1 rounded-full text-sm flex items-center">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No sessions scheduled yet</p>
                    <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center mx-auto">
                      <Plus size={18} className="mr-1" />
                      Schedule First Session
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Group Participants</h3>
                  <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center">
                    <UserPlus size={18} className="mr-1" />
                    Add Participant
                  </button>
                </div>

                {participants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Email</th>
                          <th className="py-3 px-4 text-left">Join Date</th>
                          <th className="py-3 px-4 text-left">Attendance</th>
                          <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant) => {
                          const attendanceRate =
                            (participant.attendance.filter((a) => a.attended).length / participant.attendance.length) *
                            100

                          return (
                            <tr key={participant.id} className="border-t hover:bg-gray-50">
                              <td className="py-3 px-4">{participant.name}</td>
                              <td className="py-3 px-4">{participant.email}</td>
                              <td className="py-3 px-4">{participant.joinDate.toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <span className="mr-2">{attendanceRate.toFixed(0)}%</span>
                                  <span className="inline-block w-24 h-2 bg-gray-200 rounded-full">
                                    <span
                                      className="inline-block h-full bg-[#a1df7d] rounded-full"
                                      style={{ width: `${attendanceRate}%` }}
                                    ></span>
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex space-x-2">
                                  <button className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                    <MessageSquare size={16} />
                                  </button>
                                  <button className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                    <FileText size={16} />
                                  </button>
                                  <button className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No participants in this group yet</p>
                    <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center mx-auto">
                      <UserPlus size={18} className="mr-1" />
                      Add First Participant
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Group Materials</h3>
                  <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center">
                    <Plus size={18} className="mr-1" />
                    Upload Material
                  </button>
                </div>

                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No materials uploaded yet</p>
                  <button className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center mx-auto">
                    <Plus size={18} className="mr-1" />
                    Upload First Material
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
