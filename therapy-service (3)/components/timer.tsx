"use client"

import { useEffect, useState } from "react"

export function Timer() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center">
      <div className="text-xl font-bold mb-1">{time.toLocaleTimeString()}</div>
      <div className="text-sm">{time.toLocaleDateString()}</div>
    </div>
  )
}
