// Import OpenAI
import OpenAI from "openai";

// Initialize OpenAI client with Groq API key
// Using OpenAI client with Groq API key and base URL
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

interface GenerateAIResponseOptions {
  userMessage: string;
  context?: string;
}

export async function generateAIResponse(options: GenerateAIResponseOptions): Promise<string> {
  const { userMessage, context = '' } = options;
  
  // If GROQ_API_KEY is not available, use the fallback responses
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not set, using fallback responses");
    return simulateFallbackResponse(userMessage);
  }
  
  try {
    // System message to set the AI's behavior and purpose
    const systemMessage = `You are a helpful website navigation assistant for a university counseling service platform. 
    Your goal is to help users navigate the website and find the features they need. 
    Provide clear and concise directions on how to use the platform's features, such as:
    - How to book appointments
    - How to access the forums
    - How to view therapist profiles
    - How to submit feedback
    - How to use the system effectively based on their role (student, therapist, or admin)
    Keep responses concise, friendly, and focused on website functionality (under 75 words).
    ${context ? `Additional context: ${context}` : ''}`;
    
    // Make the API call to Groq (via OpenAI client)
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

    // Return the AI response
    return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again later.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm having trouble processing your request right now. Please try again in a moment, or speak with a counselor directly if you need immediate assistance.";
  }
}

// Fallback responses if API is not available
function simulateFallbackResponse(userMessage: string): string {
  const lowerCaseMessage = userMessage.toLowerCase();
  
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! I'm your website navigation assistant. How can I help you use the platform today?";
  } 
  else if (lowerCaseMessage.includes("appointment") || lowerCaseMessage.includes("schedule")) {
    return "You can schedule an appointment from your dashboard. Click on 'Appointments' in the sidebar, then the 'Book Appointment' button to select an available time slot with your preferred therapist.";
  }
  else if (lowerCaseMessage.includes("forum") || lowerCaseMessage.includes("discussion")) {
    return "To access the community forums, click on the 'Forums' link in the sidebar menu. There you can view existing discussions or start a new one by clicking the 'New Post' button.";
  }
  else if (lowerCaseMessage.includes("feedback") || lowerCaseMessage.includes("review")) {
    return "You can submit feedback for your appointments by going to the 'Feedback' section from your dashboard or clicking on a completed appointment and selecting 'Leave Feedback'.";
  }
  else if (lowerCaseMessage.includes("profile") || lowerCaseMessage.includes("account")) {
    return "To view or edit your profile, click on your name in the top right corner and select 'Profile' from the dropdown menu.";
  }
  else if (lowerCaseMessage.includes("therapist") || lowerCaseMessage.includes("counselor")) {
    return "You can view available therapists when booking an appointment. Each therapist has a profile with their specialization and availability information.";
  }
  else if (lowerCaseMessage.includes("thank")) {
    return "You're welcome! I'm here to help you navigate the website. Is there anything else you'd like to know about using the platform?";
  }
  else {
    return "I'm here to help you navigate the website. You can ask me how to find specific features like booking appointments, accessing forums, submitting feedback, or any other platform functionality you need assistance with.";
  }
}