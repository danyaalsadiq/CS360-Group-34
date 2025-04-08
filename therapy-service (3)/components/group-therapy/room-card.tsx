"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, Users, Lock, Edit, Trash2 } from "lucide-react"
import type { TherapyRoom } from "@/types/therapy-types"

interface RoomCardProps {
  room: TherapyRoom
  onEdit?: (room: TherapyRoom) => void
  onDelete?: (roomId: string) => void
}

export function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const participantPercentage = (room.participants / room.maxParticipants) * 100

  return (
    <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{room.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit?.(room)}
            className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="text-sm mb-4">{room.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <Calendar className="mr-2" size={16} />
          <span>{room.schedule}</span>
        </div>
        <div className="flex items-center text-sm">
          <Clock className="mr-2" size={16} />
          <span>{room.time}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="mr-2" size={16} />
          <span>
            {room.participants}/{room.maxParticipants} Participants
          </span>
          <span className="ml-2 inline-block w-24 h-2 bg-gray-200 rounded-full">
            <span
              className="inline-block h-full bg-[#a1df7d] rounded-full"
              style={{ width: `${participantPercentage}%` }}
            ></span>
          </span>
        </div>
        {room.isPrivate && (
          <div className="flex items-center text-sm text-amber-600">
            <Lock className="mr-2" size={16} />
            <span>Private Room</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href={`/group-therapy/manage/${room.id}`} className="block w-full">
          <button className="w-full bg-[#a1df7d] hover:bg-[#a1df7d]/80 px-4 py-2 rounded-full text-sm font-medium">
            Manage Room
          </button>
        </Link>
      </div>

      {showConfirmDelete && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete the room "{room.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(room.id)
                  setShowConfirmDelete(false)
                }}
                className="bg-[#df7d7d] hover:bg-[#df7d7d]/80 px-4 py-2 rounded-full text-sm"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
