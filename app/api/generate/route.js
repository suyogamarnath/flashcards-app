import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Please enter some notes." }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY environment variable." }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://flashcard-app.vercel.app",
        "X-Title": "Flashcard Generator"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "You are a flashcard generator. Extract key concepts. Output ONLY a raw JSON object matching: {\"flashcards\": [{\"question\": \"...\", \"answer\": \"...\"}]}. Do not include safety headers, intro text, or markdown blocks.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "OpenRouter API request failed." }, { status: response.status });
    }

    const rawContent = data.choices[0]?.message?.content || "";

    // Extract the JSON object starting from the first '{' to the last '}'
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "The model did not return a valid JSON object. Please try again." }, { status: 500 });
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ flashcards: parsedData.flashcards || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to process flashcard response." }, { status: 500 });
  }
}
