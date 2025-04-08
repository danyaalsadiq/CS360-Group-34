// Simple crypto function to hash passwords
// Note: In a production app, use a proper hashing library like bcrypt
function hashPassword(password: string): string {
  // This is a simple hash function for demonstration purposes only
  // DO NOT use this in production - use a proper hashing library
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

export interface User {
  id: string
  email: string
  name: string
  role: "therapist" | "admin" | "student"
  passwordHash: string
  createdAt: string
}

// Get users from localStorage
function getUsers(): User[] {
  try {
    const usersJson = localStorage.getItem("users")
    return usersJson ? JSON.parse(usersJson) : []
  } catch (error) {
    console.error("Error retrieving users:", error)
    return []
  }
}

// Save users to localStorage
function saveUsers(users: User[]): void {
  localStorage.setItem("users", JSON.stringify(users))
}

// Find user by email
function findUserByEmail(email: string): User | undefined {
  const users = getUsers()
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

// Find user by ID
function findUserById(id: string): User | undefined {
  const users = getUsers()
  return users.find((user) => user.id === id)
}

// Create a new user
export async function createUser(userData: {
  email: string
  password: string
  name: string
  role: "therapist" | "admin" | "student"
}): Promise<Omit<User, "passwordHash">> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Check if user already exists
  if (findUserByEmail(userData.email)) {
    throw new Error("A user with this email already exists")
  }

  // Create new user object
  const newUser: User = {
    id: Date.now().toString(),
    email: userData.email,
    name: userData.name,
    role: userData.role,
    passwordHash: hashPassword(userData.password),
    createdAt: new Date().toISOString(),
  }

  // Add to users array
  const users = getUsers()
  users.push(newUser)
  saveUsers(users)

  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

// Authenticate a user
export async function authenticateUser(email: string, password: string): Promise<Omit<User, "passwordHash"> | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = findUserByEmail(email)

  // Check if user exists and password matches
  if (user && user.passwordHash === hashPassword(password)) {
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  return null
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, "id" | "email" | "passwordHash" | "createdAt">>,
): Promise<Omit<User, "passwordHash">> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const users = getUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  // Update user with new data
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  }

  saveUsers(users)

  // Return updated user without password hash
  const { passwordHash, ...userWithoutPassword } = users[userIndex]
  return userWithoutPassword
}

// Initialize with default users if none exist
export function initializeAuth(): void {
  const users = getUsers()

  if (users.length === 0) {
    // Add default users for each role
    const defaultUsers: User[] = [
      {
        id: "1",
        email: "therapist@example.com",
        name: "Dr. Sarah Ahmed",
        role: "therapist",
        passwordHash: hashPassword("password"),
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        passwordHash: hashPassword("password"),
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        email: "student@example.com",
        name: "John Student",
        role: "student",
        passwordHash: hashPassword("password"),
        createdAt: new Date().toISOString(),
      },
    ]

    saveUsers(defaultUsers)
  }
}
