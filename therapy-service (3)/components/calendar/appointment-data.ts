// Mock data for appointments
export type Appointment = {
  id: string
  title: string
  studentName: string
  studentId: string
  start: Date
  end: Date
  status: "confirmed" | "pending" | "cancelled" | "completed"
  notes?: string
  color?: string
}

// Helper function to create a date for the current week
const getDateForWeek = (dayOffset: number, hour: number, minute = 0): Date => {
  const date = new Date()
  const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Calculate the date for the specified day of the current week
  date.setDate(date.getDate() - day + dayOffset)
  date.setHours(hour, minute, 0, 0)

  return date
}

// Generate mock appointments for the current week
export const mockAppointments: Appointment[] = [
  // Monday
  {
    id: "1",
    title: "Initial Assessment",
    studentName: "Ahmed Khan",
    studentId: "2021-CS-123",
    start: getDateForWeek(1, 9, 0), // Monday 9:00 AM
    end: getDateForWeek(1, 10, 0), // Monday 10:00 AM
    status: "confirmed",
    notes: "First session with new student",
    color: "#4285F4", // Blue
  },
  {
    id: "2",
    title: "Follow-up Session",
    studentName: "Fatima Ali",
    studentId: "2022-EE-045",
    start: getDateForWeek(1, 11, 0), // Monday 11:00 AM
    end: getDateForWeek(1, 12, 0), // Monday 12:00 PM
    status: "confirmed",
    notes: "Anxiety management techniques",
    color: "#4285F4", // Blue
  },
  {
    id: "3",
    title: "Group Session: Stress Management",
    studentName: "Group Session",
    studentId: "GROUP-01",
    start: getDateForWeek(1, 14, 0), // Monday 2:00 PM
    end: getDateForWeek(1, 15, 30), // Monday 3:30 PM
    status: "confirmed",
    notes: "8 participants",
    color: "#EA4335", // Red
  },

  // Tuesday
  {
    id: "4",
    title: "Therapy Session",
    studentName: "Omar Farooq",
    studentId: "2020-BBA-189",
    start: getDateForWeek(2, 10, 0), // Tuesday 10:00 AM
    end: getDateForWeek(2, 11, 0), // Tuesday 11:00 AM
    status: "confirmed",
    color: "#4285F4", // Blue
  },
  {
    id: "5",
    title: "Crisis Intervention",
    studentName: "Zainab Malik",
    studentId: "2023-CS-078",
    start: getDateForWeek(2, 13, 0), // Tuesday 1:00 PM
    end: getDateForWeek(2, 14, 0), // Tuesday 2:00 PM
    status: "confirmed",
    notes: "Urgent appointment",
    color: "#FBBC05", // Yellow/Orange
  },

  // Wednesday
  {
    id: "6",
    title: "Coffee Chat",
    studentName: "Staff Meeting",
    studentId: "STAFF-01",
    start: getDateForWeek(3, 9, 0), // Wednesday 9:00 AM
    end: getDateForWeek(3, 9, 30), // Wednesday 9:30 AM
    status: "confirmed",
    notes: "Weekly staff check-in",
    color: "#34A853", // Green
  },
  {
    id: "7",
    title: "Therapy Session",
    studentName: "Ayesha Malik",
    studentId: "2023-CS-078",
    start: getDateForWeek(3, 11, 0), // Wednesday 11:00 AM
    end: getDateForWeek(3, 12, 0), // Wednesday 12:00 PM
    status: "confirmed",
    color: "#4285F4", // Blue
  },
  {
    id: "8",
    title: "Workshop: Mindfulness",
    studentName: "Group Session",
    studentId: "GROUP-02",
    start: getDateForWeek(3, 15, 0), // Wednesday 3:00 PM
    end: getDateForWeek(3, 16, 30), // Wednesday 4:30 PM
    status: "confirmed",
    notes: "12 participants",
    color: "#EA4335", // Red
  },

  // Thursday
  {
    id: "9",
    title: "Therapy Session",
    studentName: "Zain Ahmed",
    studentId: "2021-CE-112",
    start: getDateForWeek(4, 9, 0), // Thursday 9:00 AM
    end: getDateForWeek(4, 10, 0), // Thursday 10:00 AM
    status: "confirmed",
    color: "#4285F4", // Blue
  },
  {
    id: "10",
    title: "Team Meeting",
    studentName: "CAPS Staff",
    studentId: "STAFF-02",
    start: getDateForWeek(4, 13, 0), // Thursday 1:00 PM
    end: getDateForWeek(4, 14, 0), // Thursday 2:00 PM
    status: "confirmed",
    notes: "Monthly team meeting",
    color: "#34A853", // Green
  },

  // Friday
  {
    id: "11",
    title: "Coffee Chat",
    studentName: "Staff Meeting",
    studentId: "STAFF-01",
    start: getDateForWeek(5, 9, 0), // Friday 9:00 AM
    end: getDateForWeek(5, 9, 30), // Friday 9:30 AM
    status: "confirmed",
    notes: "End of week check-in",
    color: "#34A853", // Green
  },
  {
    id: "12",
    title: "Therapy Session",
    studentName: "Bilal Hassan",
    studentId: "2022-CS-056",
    start: getDateForWeek(5, 10, 0), // Friday 10:00 AM
    end: getDateForWeek(5, 11, 0), // Friday 11:00 AM
    status: "confirmed",
    color: "#4285F4", // Blue
  },
  {
    id: "13",
    title: "Happy Hour",
    studentName: "All Staff",
    studentId: "STAFF-ALL",
    start: getDateForWeek(5, 16, 0), // Friday 4:00 PM
    end: getDateForWeek(5, 17, 0), // Friday 5:00 PM
    status: "confirmed",
    notes: "Weekly wind-down",
    color: "#EA4335", // Red
  },
]

// Function to get appointments for a specific day
export const getAppointmentsForDay = (dayOffset: number): Appointment[] => {
  return mockAppointments.filter((appointment) => {
    const appointmentDay = appointment.start.getDay()
    return appointmentDay === dayOffset
  })
}

// Function to get all appointments
export const getAllAppointments = (): Appointment[] => {
  return mockAppointments
}
