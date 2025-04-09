"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useUser } from "@/components/user-context"
import type { TherapyRoom } from "@/types/therapy-types"

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (room: Omit<TherapyRoom, "id">) => void
  editRoom?: TherapyRoom
}

export function CreateRoomModal({ isOpen, onClose, onSave, editRoom }: CreateRoomModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState<Omit<TherapyRoom, "id">>({
    name: editRoom?.name || "",
    description: editRoom?.description || "",
    schedule: editRoom?.schedule || "Weekly",
    time: editRoom?.time || "",
    therapist: user?.name || "",
    participants: editRoom?.participants || 0,
    maxParticipants: editRoom?.maxParticipants || 10,
    isPrivate: editRoom?.isPrivate || false,
    topics: editRoom?.topics || [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Room name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.time.trim()) {
      newErrors.time = "Time is required"
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = "Maximum participants must be at least 2"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSave(formData)
      onClose()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseInt(value) : value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editRoom ? "Edit Group Therapy Room" : "Create New Group Therapy Room"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block font-medium mb-1">
                Room Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="e.g., Anxiety Management Group"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full p-2 border rounded-lg ${errors.description ? "border-red-500" : "border-gray-300"}`}
                placeholder="Describe the purpose and goals of this group therapy room"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schedule" className="block font-medium mb-1">
                  Schedule
                </label>
                <select
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="One-time">One-time session</option>
                </select>
              </div>

              <div>
                <label htmlFor="time" className="block font-medium mb-1">
                  Time
                </label>
                <input
                  type="text"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg ${errors.time ? "border-red-500" : "border-gray-300"}`}
                  placeholder="e.g., Mondays, 4:00 PM - 5:30 PM"
                />
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxParticipants" className="block font-medium mb-1">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min={2}
                  className={`w-full p-2 border rounded-lg ${errors.maxParticipants ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
              </div>

              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="isPrivate" className="font-medium">
                  Private Room (Invitation Only)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#E4D7BE] hover:bg-[#E4D7BE]/80 border-2 border-[#DFB97D] rounded-xl py-3 px-8 text-center font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#a1df7d] hover:bg-[#a1df7d]/80 rounded-xl py-3 px-8 text-center font-medium transition-all"
            >
              {editRoom ? "Save Changes" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
