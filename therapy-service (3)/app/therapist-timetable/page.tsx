import Link from "next/link"
import { Timer } from "@/components/timer"

// Sample data for the therapist's timetable
const appointments = [
  {
    id: 1,
    studentName: "Ahmed Khan",
    rollNumber: "2021-CS-123",
    time: "09:00 AM - 10:00 AM",
    status: "Confirmed",
    notes: "Follow-up session",
  },
  {
    id: 2,
    studentName: "Fatima Ali",
    rollNumber: "2022-EE-045",
    time: "10:00 AM - 11:00 AM",
    status: "Disturbed",
    notes: "Initial assessment",
  },
  {
    id: 3,
    studentName: "Omar Farooq",
    rollNumber: "2020-BBA-189",
    time: "11:30 AM - 12:30 PM",
    status: "Confirmed",
    notes: "Stress management",
  },
  {
    id: 4,
    studentName: "Ayesha Malik",
    rollNumber: "2023-CS-078",
    time: "02:00 PM - 03:00 PM",
    status: "Anxious",
    notes: "Exam anxiety",
  },
  {
    id: 5,
    studentName: "Zain Ahmed",
    rollNumber: "2021-CE-112",
    time: "03:30 PM - 04:30 PM",
    status: "Confirmed",
    notes: "Depression follow-up",
  },
]

export default function TherapistTimetable() {
  return (
    <main className="min-h-screen p-8">
      <Timer />

      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <button className="bg-card border-2 border-card-border rounded-full px-6 py-2 font-medium hover:shadow-lg transition-all">
            ← Back to Home
          </button>
        </Link>
        <h1 className="text-3xl font-bold">Therapist Timetable</h1>
        <div className="w-[100px]"></div> {/* Spacer for alignment */}
      </div>

      <div className="card max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Today's Appointments</h2>
          <p className="font-medium">{new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border-2 border-card-border rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-lg">{appointment.studentName}</h3>
                  <p className="text-sm">{appointment.rollNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{appointment.time}</p>
                  <p
                    className={`text-sm ${
                      appointment.status === "Disturbed"
                        ? "text-cancel"
                        : appointment.status === "Anxious"
                          ? "text-yellow-500"
                          : "text-success"
                    }`}
                  >
                    {appointment.status}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-sm">
                <span className="font-medium">Notes:</span> {appointment.notes}
              </p>

              <div className="flex gap-3 mt-3">
                <button className="bg-success/80 hover:bg-success px-4 py-1 rounded-full text-sm">Complete</button>
                <button className="bg-card hover:bg-card/80 px-4 py-1 rounded-full text-sm">Reschedule</button>
                <button className="bg-cancel/80 hover:bg-cancel px-4 py-1 rounded-full text-sm">Cancel</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button className="bg-card border-2 border-card-border rounded-full px-6 py-2 font-medium hover:shadow-lg transition-all">
            View Full Calendar
          </button>
        </div>
      </div>
    </main>
  )
}
