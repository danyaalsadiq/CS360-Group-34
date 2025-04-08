"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Filter } from "lucide-react"
import { Timer } from "@/components/timer"
import { useUser } from "@/components/user-context"
import { RoomCard } from "@/components/group-therapy/room-card"
import { CreateRoomModal } from "@/components/group-therapy/create-room-modal"
import type { TherapyRoom } from "@/types/therapy-types"

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

export default function GroupTherapyPage() {
  const { user, loading } = useUser()
  const [rooms, setRooms] = useState<TherapyRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<TherapyRoom[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<TherapyRoom | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")

  // Load only the therapist's own rooms
  useEffect(() => {
    if (!loading && user) {
      // In a real app, this would be an API call with proper filtering
      const therapistRooms = mockRooms.filter((room) => room.therapist === user.name)
      setRooms(therapistRooms)
    }
  }, [user, loading])

  // Apply search filter
  useEffect(() => {
    let filtered = [...rooms]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(term) ||
          room.description.toLowerCase().includes(term) ||
          room.topics.some((topic) => topic.toLowerCase().includes(term)),
      )
    }

    setFilteredRooms(filtered)
  }, [rooms, searchTerm])

  const handleCreateRoom = (newRoom: Omit<TherapyRoom, "id">) => {
    // In a real app, this would be an API call
    const roomWithId: TherapyRoom = {
      ...newRoom,
      id: Date.now().toString(),
    }

    setRooms((prev) => [...prev, roomWithId])
  }

  const handleEditRoom = (updatedRoom: Omit<TherapyRoom, "id">) => {
    if (!editRoom) return

    // In a real app, this would be an API call
    const roomWithId: TherapyRoom = {
      ...updatedRoom,
      id: editRoom.id,
    }

    setRooms((prev) => prev.map((room) => (room.id === editRoom.id ? roomWithId : room)))
    setEditRoom(undefined)
  }

  const handleDeleteRoom = (roomId: string) => {
    // In a real app, this would be an API call
    setRooms((prev) => prev.filter((room) => room.id !== roomId))
  }

  const openEditModal = (room: TherapyRoom) => {
    setEditRoom(room)
    setIsCreateModalOpen(true)
  }

  if (loading) {
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
          <Link href="/">
            <button className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-full px-6 py-2 font-medium hover:shadow-lg transition-all">
              ← Back to Home
            </button>
          </Link>
          <h1 className="text-3xl font-bold">My Group Therapy Rooms</h1>
          <Timer />
        </div>

        {/* Controls */}
        <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Manage Your Therapy Rooms</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <div>
              {user?.role === "therapist" && (
                <button
                  onClick={() => {
                    setEditRoom(undefined)
                    setIsCreateModalOpen(true)
                  }}
                  className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all flex items-center"
                >
                  <Plus size={18} className="mr-1" />
                  Create New Room
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Room Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={openEditModal} onDelete={handleDeleteRoom} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-4">You don't have any group therapy rooms yet.</p>
            {user?.role === "therapist" && (
              <button
                onClick={() => {
                  setEditRoom(undefined)
                  setIsCreateModalOpen(true)
                }}
                className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-2 px-4 text-center font-medium transition-all inline-flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Create New Room
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditRoom(undefined)
        }}
        onSave={editRoom ? handleEditRoom : handleCreateRoom}
        editRoom={editRoom}
      />
    </main>
  )
}
