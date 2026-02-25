import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

interface TripContext {
  title: string;
  startDate: string;
  endDate: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  description?: string | null;
  guestCount: number;
  guestNames: string[];
  mealCount: number;
  activityCount: number;
  expenseTotal: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAssistant(
  message: string,
  tripContext: TripContext,
  history: ChatMessage[] = []
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `You are a helpful trip planning assistant for "${tripContext.title}".

Trip Details:
- Dates: ${tripContext.startDate} to ${tripContext.endDate}
- Location: ${[tripContext.address, tripContext.city, tripContext.state].filter(Boolean).join(", ") || "Not specified"}
- Description: ${tripContext.description || "None"}
- Guests: ${tripContext.guestCount} (${tripContext.guestNames.slice(0, 10).join(", ")}${tripContext.guestNames.length > 10 ? "..." : ""})
- Meals planned: ${tripContext.mealCount}
- Activities planned: ${tripContext.activityCount}
- Total expenses so far: $${tripContext.expenseTotal.toFixed(2)}

You help with:
- Activity suggestions for the area
- Restaurant and dining recommendations
- Packing suggestions based on location/weather
- Trip logistics and planning advice
- Group coordination tips
- Local attractions and hidden gems

Keep responses concise, friendly, and actionable. Use bullet points when listing suggestions. Don't use markdown headers.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt + "\n\nPlease acknowledge you understand the trip context and are ready to help." }] },
    { role: "model" as const, parts: [{ text: "I understand! I'm ready to help plan your trip. What can I help you with?" }] },
    ...history.flatMap((msg) => [
      { role: (msg.role === "user" ? "user" : "model") as "user" | "model", parts: [{ text: msg.content }] },
    ]),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const result = await model.generateContent({ contents });
  const response = result.response;
  return response.text();
}
