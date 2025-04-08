"use client"

import type { Appointment } from "@/components/calendar/appointment-data"
import { X } from "lucide-react"

interface AppointmentModalProps {
  appointment: Appointment | null
  onClose: () => void
  onCancel: (appointmentId: string) => void
}

export function AppointmentModal({ appointment, onClose, onCancel }: AppointmentModalProps) {
  if (!appointment) return null

  const handleCancel = () => {
    onCancel(appointment.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-[#E4D7BE] border-[12px] border-[#DFB97D] rounded-xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Appointment Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-medium">Student Name</p>
            <p className="text-lg">{appointment.studentName}</p>
          </div>

          <div>
            <p className="font-medium">Roll Number</p>
            <p className="text-lg">{appointment.studentId}</p>
          </div>

          <div>
            <p className="font-medium">Time</p>
            <p className="text-lg">
              {appointment.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {appointment.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div>
            <p className="font-medium">Status</p>
            <p className="text-lg capitalize">{appointment.status}</p>
          </div>

          {appointment.notes && (
            <div>
              <p className="font-medium">Notes</p>
              <p className="text-lg">{appointment.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={handleCancel}
            className="bg-[#df7d7d] hover:bg-[#df7d7d]/80 rounded-xl py-3 px-8 text-center text-xl font-medium transition-all w-32"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
