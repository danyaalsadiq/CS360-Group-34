export interface TherapyRoom {
  id: string
  name: string
  description: string
  schedule: string
  time: string
  therapist: string
  participants: number
  maxParticipants: number
  isPrivate: boolean
  topics: string[]
}

export interface TherapySession {
  id: string
  roomId: string
  date: Date
  startTime: string
  endTime: string
  title: string
  description: string
  attendees: string[]
  maxAttendees: number
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  notes?: string
}

export interface Participant {
  id: string
  name: string
  email: string
  joinDate: Date
  attendance: {
    sessionId: string
    attended: boolean
  }[]
}
