"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { mockAppointments, type Appointment } from "@/components/calendar/appointment-data"
import { AppointmentModal } from "@/components/appointment-modal"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [view, setView] = useState<"day" | "week" | "month" | "year">("week")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Get the start of the week (Sunday)
  const getStartOfWeek = (date: Date) => {
    const result = new Date(date)
    const day = result.getDay()
    result.setDate(result.getDate() - day)
    return result
  }

  // Get the days of the current week
  const getDaysOfWeek = () => {
    const startOfWeek = getStartOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })
  }

  // Format date as "MMM D"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format day number
  const formatDayNumber = (date: Date) => {
    return date.getDate()
  }

  // Format day name
  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
  }

  // Format time (e.g., "9 AM")
  const formatTime = (hour: number) => {
    return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`
  }

  // Get the month and year for display
  const getMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Check if an appointment is in a specific time slot
  const isAppointmentInTimeSlot = (appointment: Appointment, day: Date, hour: number) => {
    const appointmentDay = appointment.start.getDay()
    const appointmentStartHour = appointment.start.getHours()
    const appointmentEndHour = appointment.end.getHours()
    const appointmentEndMinutes = appointment.end.getMinutes()

    // Adjust end hour if there are minutes (e.g., 2:30 PM should still show in the 2 PM slot)
    const adjustedEndHour = appointmentEndMinutes > 0 ? appointmentEndHour + 1 : appointmentEndHour

    return appointmentDay === day.getDay() && appointmentStartHour <= hour && adjustedEndHour > hour
  }

  // Get appointments for a specific time slot
  const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
    return appointments.filter((appointment) => isAppointmentInTimeSlot(appointment, day, hour))
  }

  // Format appointment time
  const formatAppointmentTime = (appointment: Appointment) => {
    const startHour = appointment.start.getHours()
    const startMinutes = appointment.start.getMinutes()
    const endHour = appointment.end.getHours()
    const endMinutes = appointment.end.getMinutes()

    const formatHourMinutes = (hour: number, minutes: number) => {
      return `${hour % 12 || 12}:${minutes.toString().padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`
    }

    return `${formatHourMinutes(startHour, startMinutes)} - ${formatHourMinutes(endHour, endMinutes)}`
  }

  // Load appointments
  useEffect(() => {
    setAppointments(mockAppointments)
  }, [])

  // Generate time slots from 7 AM to 5 PM
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 7)
  const daysOfWeek = getDaysOfWeek()

  // Add this new function to handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    // In a real application, you would make an API call here
    // For now, we'll just update the local state
    setAppointments((prevAppointments) => prevAppointments.filter((appointment) => appointment.id !== appointmentId))
  }

  return (
    <div className="min-h-screen bg-[#BBE0E5] p-4">
      <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <button className="px-4 py-2 bg-[#E4D7BE] border border-[#DFB97D] rounded-lg hover:bg-[#DFB97D] transition-colors">
                ← Back
              </button>
            </Link>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center">
              <button onClick={goToPreviousWeek} className="p-1 rounded-full hover:bg-gray-200">
                <ChevronLeft size={20} />
              </button>
              <button onClick={goToNextWeek} className="p-1 rounded-full hover:bg-gray-200">
                <ChevronRight size={20} />
              </button>
            </div>
            <h2 className="text-xl font-bold">{getMonthYear()}</h2>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setView("day")}
                className={`px-4 py-2 ${view === "day" ? "bg-red-500 text-white" : "bg-white"}`}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-4 py-2 ${view === "week" ? "bg-red-500 text-white" : "bg-white"}`}
              >
                Week
              </button>
              <button
                onClick={() => setView("month")}
                className={`px-4 py-2 ${view === "month" ? "bg-red-500 text-white" : "bg-white"}`}
              >
                Month
              </button>
              <button
                onClick={() => setView("year")}
                className={`px-4 py-2 ${view === "year" ? "bg-red-500 text-white" : "bg-white"}`}
              >
                Year
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Calendar Week View */}
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 border-r">
            <div className="h-16 border-b"></div> {/* Empty cell for the header */}
            {timeSlots.map((hour) => (
              <div key={hour} className="h-24 border-b flex items-start justify-end pr-2 pt-1 text-gray-500">
                <span>{formatTime(hour)}</span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 grid grid-cols-7">
            {/* Day Headers */}
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className={`h-16 border-b border-r p-2 flex flex-col items-center justify-center ${
                  day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-sm text-gray-500">{formatDayName(day)}</div>
                <div className="text-xl font-bold">{formatDayNumber(day)}</div>
              </div>
            ))}

            {/* Time Slots Grid */}
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                {daysOfWeek.map((day, dayIndex) => (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`h-24 border-b border-r relative ${
                      day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth()
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    {/* Render appointments in this time slot */}
                    {getAppointmentsForTimeSlot(day, hour).map((appointment, i) => (
                      <div
                        key={`${appointment.id}-${i}`}
                        className="absolute inset-1 rounded-md p-2 overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                        style={{
                          backgroundColor: `${appointment.color}20`,
                          borderLeft: `4px solid ${appointment.color}`,
                        }}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="text-xs font-bold" style={{ color: appointment.color }}>
                          {formatAppointmentTime(appointment)}
                        </div>
                        <div className="text-sm font-medium truncate">{appointment.title}</div>
                        <div className="text-xs truncate">{appointment.studentName}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <AppointmentModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCancel={handleCancelAppointment}
      />
    </div>
  )
}
