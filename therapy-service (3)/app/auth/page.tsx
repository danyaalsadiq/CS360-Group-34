import { Timer } from "@/components/timer"
import { AuthForm } from "@/components/auth/auth-form"
import { LogoutButton } from "@/components/logout-button";

// Inside your JSX
<LogoutButton />

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#BBE0E5] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">CAPS Management System</h1>
          <Timer />
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2">Welcome to the Therapy Service Platform</h2>
            <p className="text-gray-600">Please sign in to continue or create a new account</p>
          </div>

          <AuthForm />
        </div>
      </div>
    </main>
  )
}
