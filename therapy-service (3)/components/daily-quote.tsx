"use client"

import { useEffect, useState } from "react"

const quotes = [
  "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
  "Healing is not linear, but progress is still progress. - Unknown",
  "Self-care is not selfish. You cannot serve from an empty vessel. - Eleanor Brown",
  "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, or frustrated. - Unknown",
  "Mental health is not a destination, but a process. It's about how you drive, not where you're going. - Unknown",
  "Be gentle with yourself. You're doing the best you can. - Unknown",
  "Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time. - Unknown",
  "You are not your illness. You have an individual story to tell. You have a name, a history, a personality. - Unknown",
]

export function DailyQuote() {
  const [quote, setQuote] = useState("")

  useEffect(() => {
    // Get today's date as a number to use as a seed
    const today = new Date()
    const dateString = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`
    const dateNumber = Number.parseInt(dateString)

    // Use the date number to select a quote (this ensures the same quote shows for the whole day)
    const quoteIndex = dateNumber % quotes.length
    setQuote(quotes[quoteIndex])
  }, [])

  return (
    <div className="bg-card border-2 border-card-border rounded-[var(--radius)] p-6 max-w-2xl mx-auto my-6 text-center italic">
      <p>Quote of the day:</p>
      <p className="font-medium mt-2">{quote}</p>
    </div>
  )
}
