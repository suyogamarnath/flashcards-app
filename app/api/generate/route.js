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
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Flashcard Generator"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a flashcard generator. Extract key concepts and return ONLY valid JSON matching this exact structure: { \"flashcards\": [ { \"question\": \"...\", \"answer\": \"...\" } ] }",
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

    // Clean out markdown code blocks if present
    let rawContent = data.choices[0].message.content;
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(rawContent);

    return NextResponse.json({ flashcards: parsedData.flashcards || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to parse flashcard data." }, { status: 500 });
  }
}
