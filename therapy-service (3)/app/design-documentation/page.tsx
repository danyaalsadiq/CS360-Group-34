"use client"

import { FigmaDocumentation } from "@/components/figma-documentation"

// Sample data for demonstration
const sampleScreens = [
  {
    id: "home-screen",
    title: "Home Screen",
    imageUrl: "/placeholder.svg?height=800&width=1200",
    description: "The main dashboard for therapists to view their schedule and access key features.",
    elements: [
      {
        id: "calendar-button",
        name: "Calendar Button",
        description: "Navigates to the calendar view where therapists can see and manage their appointments.",
        type: "button" as const,
        x: 20,
        y: 30,
      },
      {
        id: "upcoming-meetings",
        name: "Upcoming Meetings Card",
        description: "Displays the next scheduled appointment with student details and status.",
        type: "card" as const,
        x: 45,
        y: 30,
      },
      {
        id: "timer-display",
        name: "Timer Display",
        description: "Shows the current time and date to help therapists stay on schedule.",
        type: "other" as const,
        x: 75,
        y: 30,
      },
    ],
    requirements: [
      {
        id: "req-1",
        title: "Quick Access to Schedule",
        description: "Therapists need immediate access to their daily schedule upon logging in.",
      },
      {
        id: "req-2",
        title: "Appointment Preview",
        description: "System should display upcoming appointment details prominently on the home screen.",
      },
    ],
    relationships: [
      {
        screenId: "calendar-screen",
        relationship: "leads to" as const,
        description: "Clicking the Calendar button takes the user to the Calendar screen.",
      },
    ],
  },
  {
    id: "calendar-screen",
    title: "Calendar Screen",
    imageUrl: "/placeholder.svg?height=800&width=1200",
    description: "Weekly view of all scheduled appointments with time slots and student information.",
    elements: [
      {
        id: "back-button",
        name: "Back Button",
        description: "Returns to the home screen.",
        type: "button" as const,
        x: 10,
        y: 15,
      },
      {
        id: "week-navigation",
        name: "Week Navigation",
        description: "Allows therapists to navigate between different weeks.",
        type: "button" as const,
        x: 30,
        y: 15,
      },
      {
        id: "appointment-slot",
        name: "Appointment Slot",
        description: "Clickable appointment that shows details when selected.",
        type: "button" as const,
        x: 50,
        y: 40,
      },
    ],
    requirements: [
      {
        id: "req-3",
        title: "Weekly Schedule View",
        description: "Therapists need to see their entire week at a glance with all appointments.",
      },
      {
        id: "req-4",
        title: "Appointment Details",
        description: "Clicking on an appointment should reveal detailed information about the student and session.",
      },
    ],
    relationships: [
      {
        screenId: "home-screen",
        relationship: "comes from" as const,
        description: "User arrives at this screen after clicking the Calendar button on the Home screen.",
      },
      {
        screenId: "appointment-details",
        relationship: "leads to" as const,
        description: "Clicking an appointment slot opens the Appointment Details modal.",
      },
    ],
  },
  {
    id: "appointment-details",
    title: "Appointment Details Modal",
    imageUrl: "/placeholder.svg?height=800&width=1200",
    description: "Modal showing detailed information about a selected appointment with options to manage it.",
    elements: [
      {
        id: "close-button",
        name: "Close Button",
        description: "Closes the modal and returns to the calendar view.",
        type: "button" as const,
        x: 85,
        y: 15,
      },
      {
        id: "student-info",
        name: "Student Information",
        description: "Displays the student's name, ID, and other relevant details.",
        type: "other" as const,
        x: 50,
        y: 30,
      },
      {
        id: "cancel-button",
        name: "Cancel Button",
        description: "Allows the therapist to cancel the selected appointment.",
        type: "button" as const,
        x: 50,
        y: 70,
      },
    ],
    requirements: [
      {
        id: "req-5",
        title: "View Appointment Details",
        description: "Therapists need to see complete information about each appointment.",
      },
      {
        id: "req-6",
        title: "Cancel Appointments",
        description: "Therapists need the ability to cancel appointments when necessary.",
      },
    ],
    relationships: [
      {
        screenId: "calendar-screen",
        relationship: "comes from" as const,
        description: "This modal appears when an appointment is clicked in the Calendar screen.",
      },
    ],
  },
]

export default function DesignDocumentationPage() {
  return (
    <div>
      <FigmaDocumentation screens={sampleScreens} />
    </div>
  )
}
