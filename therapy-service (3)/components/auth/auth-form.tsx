"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/user-context"
import { Eye, EyeOff } from "lucide-react"
import { createUser, authenticateUser } from "@/lib/auth"

type AuthMode = "login" | "signup"
type UserRole = "student" | "therapist" | "admin"

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<UserRole>("student")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { setUser } = useUser()
  const router = useRouter()

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login")
    setError(null)
  }

  const validateForm = () => {
    setError(null)

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name")
      return false
    }

    if (!email.trim()) {
      setError("Please enter your email")
      return false
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (mode === "login") {
        // Authenticate user with stored credentials
        const authenticatedUser = await authenticateUser(email, password)

        if (authenticatedUser) {
          setUser({
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            name: authenticatedUser.name,
            role: authenticatedUser.role,
          })

          if (rememberMe) {
            // Set a flag in localStorage to remember this user
            localStorage.setItem("rememberMe", "true")
          }

          // Redirect based on user role
          switch (authenticatedUser.role) {
            case "admin":
              router.push("/admin")
              break
            case "student":
              router.push("/student")
              break
            case "therapist":
            default:
              router.push("/")
              break
          }
        } else {
          setError("Invalid email or password")
        }
      } else {
        // Create a new user account
        const newUser = await createUser({
          email,
          password,
          name,
          role,
        })

        setUser({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        })

        // Redirect to profile page after signup to show account details
        router.push("/profile")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#E4D7BE] border-[8px] border-[#DFB97D] rounded-xl p-8 w-full max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="bg-[#BBE0E5] rounded-full p-1 inline-flex">
          <button
            onClick={() => setMode("login")}
            className={`px-6 py-2 rounded-full transition-all ${
              mode === "login" ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-[#E4D7BE]/20"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`px-6 py-2 rounded-full transition-all ${
              mode === "signup" ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-[#E4D7BE]/20"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center mb-6">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DFB97D]"
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DFB97D]"
              >
                <option value="student">Student</option>
                <option value="therapist">Therapist</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DFB97D]"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DFB97D]"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === "login" && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#DFB97D] focus:ring-[#DFB97D] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#a1df7d] hover:bg-[#a1df7d]/80 text-center py-3 rounded-lg font-medium transition-all"
        >
          {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={toggleMode} className="text-[#DFB97D] hover:underline font-medium">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={toggleMode} className="text-[#DFB97D] hover:underline font-medium">
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
