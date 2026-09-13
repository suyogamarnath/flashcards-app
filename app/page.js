"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "An unexpected error occurred.");
      } else if (data.flashcards) {
        setFlashcards(data.flashcards);
      }
    } catch (err) {
      setErrorMessage("Could not connect to server. Check your network or API route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Flashcard Generator</h1>
      
      <textarea
        rows={8}
        style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
        placeholder="Paste study notes here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{ width: "100%", padding: "12px", backgroundColor: loading ? "#9ca3af" : "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Generating..." : "Generate Flashcards"}
      </button>

      {errorMessage && (
        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", borderRadius: "6px" }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginTop: "32px" }}>
        {flashcards.map((card, index) => (
          <div key={index} style={{ border: "1px solid #e5e7eb", padding: "16px", borderRadius: "8px", backgroundColor: "#fff" }}>
            <p><strong>Q:</strong> {card.question}</p>
            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />
            <p><strong>A:</strong> {card.answer}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
