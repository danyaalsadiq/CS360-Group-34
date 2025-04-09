import type React from "react"
import type { Metadata } from "next"
import { Italiana } from "next/font/google"
import { UserProvider } from "@/components/user-context"
import { LogoutButton } from "@/components/logout-button"
import "./globals.css"

const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CAPS Management System",
  description: "Therapy service for students",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={italiana.className}>
        <UserProvider>
          <div className="min-h-screen">
            <div className="absolute top-4 right-4 z-10">
              <LogoutButton />
            </div>
            {children}
          </div>
        </UserProvider>
      </body>
    </html>
  )
}


import './globals.css'