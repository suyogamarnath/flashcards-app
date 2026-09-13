import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a study assistant. Extract key concepts from the user notes and return a JSON object containing a 'flashcards' array. Each item in the array must have a 'question' and 'answer' string.",
          },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const parsedData = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ flashcards: parsedData.flashcards || [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
