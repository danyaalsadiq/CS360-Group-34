"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/user-context"
import { X } from "lucide-react"
import type { Appointment } from "@/components/calendar/appointment-data"

interface AppointmentModalProps {
  appointment: Appointment | null
  onClose: () => void
  onCancel: (appointmentId: string) => void
}

export function AppointmentModal({ appointment, onClose, onCancel }: AppointmentModalProps) {
  const { user } = useUser()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (user?.role === "therapist") {
      fetch("http://localhost:5000/api/users/students", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStudents(data.students || []))
    }
  }, [user])

  const assignStudent = async () => {
    setAssigning(true)
    const res = await fetch("http://localhost:5000/api/appointments/assign-by-therapist", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent,
        date: appointment?.start,
      }),
    })

    const result = await res.json()
    setAssigning(false)
    if (res.ok) {
      alert("Student assigned to appointment")
      onClose()
    } else {
      alert(result.error)
    }
  }

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

        {/* THERAPIST-SPECIFIC ASSIGN STUDENT LOGIC */}
        {user?.role === "therapist" ? (
          <>
            <label className="block font-medium mb-2">Select Student</label>
            <select
              className="w-full border rounded p-2"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">-- Select --</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.username} ({student.email})
                </option>
              ))}
            </select>

            <button
              onClick={assignStudent}
              disabled={assigning}
              className="bg-success text-white px-4 py-2 rounded w-full mt-4"
            >
              {assigning ? "Assigning..." : "Assign Student"}
            </button>
          </>
        ) : (
          <>
            {/* Default View for Students */}
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
          </>
        )}
      </div>
    </div>
  )
}
