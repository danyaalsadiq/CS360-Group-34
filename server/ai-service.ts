// Import OpenAI
import OpenAI from "openai";

// Initialize OpenAI client with Groq API key
// Using OpenAI client with Groq API key and base URL
const apiKey = process.env.GROQ_API_KEY || "";
console.log("API Key available:", !!apiKey); // Log if API key is available without exposing it

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

interface GenerateAIResponseOptions {
  userMessage: string;
  context?: string;
}

export async function generateAIResponse(options: GenerateAIResponseOptions): Promise<string> {
  const { userMessage, context = '' } = options;
  
  // If GROQ_API_KEY is not available, use the fallback responses
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set or empty, using fallback responses");
    return simulateFallbackResponse(userMessage);
  }
  
  try {
    console.log("Generating AI response for message:", userMessage.substring(0, 20) + "...");
    
    // System message to set the AI's behavior and purpose
    const systemMessage = `You are a helpful website navigation assistant for a university counseling service platform. 
    Your goal is to help users navigate the website and find the features they need.
    
    IMPORTANT DETAILS ABOUT THE PLATFORM:
    - NAVIGATION: All main features are accessible from the sidebar menu, NOT from the top of the page
    - APPOINTMENTS: Students book by: 1) Going to Dashboard/Availability calendar, 2) Clicking a slot, 3) Selecting a preferred therapist, 4) Waiting for scheduling
    - CALENDAR: Accessed from sidebar, shows appointments organized as Today/Upcoming/Past
    - FORUMS: Users can create posts, comment, like, and filter by category
    - FEEDBACK: Students give feedback by: 1) Clicking Weekly Schedule, 2) Clicking their assigned slot, 3) Clicking "Join Meeting & Rate Your Therapist", 4) Rating with stars and comments, 5) Submitting
    - ADMIN: Administrators can moderate forums and manage users from their dashboard
    
    Provide clear and concise directions on how to use the platform's features based on the user's role (student, therapist, or admin).
    Keep responses concise, friendly, and focused on correct website navigation (under 100 words).
    ${context ? `Additional context: ${context}` : ''}`;
    
    // Make the API call to Groq (via OpenAI client)
    console.log("Calling Groq API with model: llama3-8b-8192");
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: "llama3-8b-8192", // Using smaller Llama 3 model for faster responses
      temperature: 0.5,
      max_tokens: 150,
      top_p: 0.95,
    });

    console.log("Received AI response successfully");
    // Return the AI response
    return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again later.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    // Fall back to simulated responses in case of API errors
    console.log("Using fallback response due to API error");
    return simulateFallbackResponse(userMessage);
  }
}

// Fallback responses if API is not available
function simulateFallbackResponse(userMessage: string): string {
  const lowerCaseMessage = userMessage.toLowerCase();
  
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! I'm your website navigation assistant. How can I help you use the platform today?";
  } 
  else if (lowerCaseMessage.includes("appointment") || lowerCaseMessage.includes("schedule") || lowerCaseMessage.includes("book")) {
    return "To book an appointment: 1) Go to Dashboard or Availability calendar from the sidebar, 2) Click on a slot, 3) Select your preferred therapist, 4) Wait for the appointment to be scheduled. The system will automatically match students with therapists based on availability.";
  }
  else if (lowerCaseMessage.includes("availability") || lowerCaseMessage.includes("time slot") || lowerCaseMessage.includes("calendar")) {
    return "Access the appointment calendar by clicking 'Calendar' in the sidebar. Students: click on a slot and select a preferred therapist, then wait for matching. Therapists: mark available slots. The system handles the matching process automatically.";
  }
  else if (lowerCaseMessage.includes("forum") || lowerCaseMessage.includes("discussion") || lowerCaseMessage.includes("post")) {
    return "Access the forums by clicking 'Forums' in the sidebar. You can browse posts by category, create new posts, comment on discussions, and like posts. Posts can be filtered by category using the dropdown menu.";
  }
  else if (lowerCaseMessage.includes("feedback") || lowerCaseMessage.includes("review") || lowerCaseMessage.includes("rate")) {
    return "To give feedback: 1) Click 'Weekly Schedule' on your sidebar, 2) Click on your assigned meeting slot, 3) Click 'Join Meeting & Rate Your Therapist', 4) Rate your therapist with 1-5 stars and add comments, 5) Click 'Submit Feedback'. Your feedback will appear in the Feedback menu.";
  }
  else if (lowerCaseMessage.includes("admin") || lowerCaseMessage.includes("moderation")) {
    return "Administrators can access forum moderation from the Admin Dashboard. Click on 'Forums' in the admin sidebar to view reported posts and comments. You can also manage therapists and students from the admin interface.";
  }
  else if (lowerCaseMessage.includes("therapist") || lowerCaseMessage.includes("counselor")) {
    return "Therapists mark available slots on their calendar by clicking on slots and confirming. When students request those slots, matching happens automatically. Therapists can view their upcoming appointments, feedback, and manage slots - all accessible from the sidebar menu.";
  }
  else if (lowerCaseMessage.includes("student") || lowerCaseMessage.includes("client")) {
    return "Students can book appointments by clicking slots on the calendar, join forums, and provide feedback for completed sessions. To book: go to the calendar, click a slot, select a therapist, and wait for confirmation. For feedback: click on your assigned slot and use the 'Join Meeting & Rate' button.";
  }
  else if (lowerCaseMessage.includes("chat") || lowerCaseMessage.includes("ai") || lowerCaseMessage.includes("help")) {
    return "This chat assistant helps you navigate the website. It's available from any page via the chat icon in the sidebar. Ask about any feature to get guidance on how to use it.";
  }

  else if (lowerCaseMessage.includes("thank")) {
    return "You're welcome! I'm here to help you navigate the website. Is there anything else you'd like to know about using the platform?";
  }
  else {
    return "I'm here to help you navigate the website. You can ask me how to find features like appointments, forums, feedback, or any other functionality. All main features are accessible from the sidebar menu.";
  }
}