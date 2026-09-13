"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [sets, setSets] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);

  // Settings & Accessibility State
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // AI Tab State
  const [aiTitle, setAiTitle] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Manual Tab State
  const [manualTitle, setManualTitle] = useState("");
  const [manualTerm, setManualTerm] = useState("");
  const [manualDef, setManualDef] = useState("");
  const [manualCards, setManualCards] = useState([]);

  // Import Tab State
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");
  const [termSeparator, setTermSeparator] = useState("tab");

  // Card Flip State
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedSets = localStorage.getItem("flashcard_sets");
      if (savedSets) {
        try { setSets(JSON.parse(savedSets)); } catch (e) {}
      }
      const savedDark = localStorage.getItem("fc_dark_mode");
      if (savedDark !== null) {
        try { setDarkMode(JSON.parse(savedDark)); } catch (e) {}
      }
      const savedContrast = localStorage.getItem("fc_high_contrast");
      if (savedContrast !== null) {
        try { setHighContrast(JSON.parse(savedContrast)); } catch (e) {}
      }
      const savedLarge = localStorage.getItem("fc_large_text");
      if (savedLarge !== null) {
        try { setLargeText(JSON.parse(savedLarge)); } catch (e) {}
      }
    }
  }, []);

  const saveSetsToStorage = (updatedSets) => {
    setSets(updatedSets);
    if (typeof window !== "undefined") {
      localStorage.setItem("flashcard_sets", JSON.stringify(updatedSets));
    }
  };

  const toggleDarkMode = (val) => {
    setDarkMode(val);
    if (typeof window !== "undefined") localStorage.setItem("fc_dark_mode", JSON.stringify(val));
  };

  const toggleHighContrast = (val) => {
    setHighContrast(val);
    if (typeof window !== "undefined") localStorage.setItem("fc_high_contrast", JSON.stringify(val));
  };

  const toggleLargeText = (val) => {
    setLargeText(val);
    if (typeof window !== "undefined") localStorage.setItem("fc_large_text", JSON.stringify(val));
  };

  const createDeck = (title, cards) => {
    if (!cards || !cards.length) return;
    const newDeck = {
      id: Date.now().toString(),
      title: title.trim() || `Untitled Set (${new Date().toLocaleDateString()})`,
      cards: cards,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDeck, ...sets];
    saveSetsToStorage(updated);
    setActiveDeckId(newDeck.id);
    setActiveTab("deck");
  };

  const deleteDeck = (id, e) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to delete this deck?")) {
      const updated = sets.filter((s) => s.id !== id);
      saveSetsToStorage(updated);
      if (activeDeckId === id) {
        setActiveDeckId(null);
        setActiveTab("ai");
      }
    }
  };

  const handleAIGenerate = async () => {
    if (!aiText) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || "Generation failed");
      } else if (data.flashcards && data.flashcards.length) {
        createDeck(aiTitle || "AI Generated Deck", data.flashcards);
        setAiText("");
        setAiTitle("");
      } else {
        setAiError("No valid flashcards generated. Try expanding your notes.");
      }
    } catch (err) {
      setAiError("Network error. Check connection or API keys.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddManualCard = () => {
    if (!manualTerm.trim() || !manualDef.trim()) return;
    setManualCards([...manualCards, { question: manualTerm.trim(), answer: manualDef.trim() }]);
    setManualTerm("");
    setManualDef("");
  };

  const handleSaveManualDeck = () => {
    if (!manualCards.length) return;
    createDeck(manualTitle || "Manual Deck", manualCards);
    setManualCards([]);
    setManualTitle("");
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    let sep = "\t";
    if (termSeparator === "comma") sep = ",";
    if (termSeparator === "dash") sep = "-";

    const lines = importText.split("\n");
    const parsedCards = [];

    lines.forEach((line) => {
      const parts = line.split(sep);
      if (parts.length >= 2) {
        const question = parts[0].trim();
        const answer = parts.slice(1).join(sep).trim();
        if (question && answer) {
          parsedCards.push({ question, answer });
        }
      }
    });

    if (parsedCards.length > 0) {
      createDeck(importTitle || "Imported Deck", parsedCards);
      setImportText("");
      setImportTitle("");
    } else {
      if (typeof window !== "undefined") {
        alert("Could not parse any cards. Make sure terms and definitions match your selected separator.");
      }
    }
  };

  const toggleFlip = (index) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!mounted) return null;

  const bg = darkMode ? (highContrast ? "#000000" : "#0f172a") : (highContrast ? "#ffffff" : "#f8fafc");
  const text = darkMode ? "#f8fafc" : "#0f172a";
  const sidebarBg = darkMode ? (highContrast ? "#000000" : "#1e293b") : (highContrast ? "#ffffff" : "#ffffff");
  const cardBg = darkMode ? (highContrast ? "#121212" : "#1e293b") : "#ffffff";
  const border = highContrast ? (darkMode ? "#ffffff" : "#000000") : (darkMode ? "#334155" : "#e2e8f0");
  const primary = highContrast ? (darkMode ? "#ffff00" : "#0000ff") : "#2563eb";
  const primaryText = highContrast && darkMode ? "#000000" : "#ffffff";

  const activeDeck = sets.find((s) => s.id === activeDeckId);

  const navButtonStyle = (isActive) => ({
    padding: "10px 14px",
    borderRadius: "6px",
    border: `1px solid ${isActive ? primary : "transparent"}`,
    backgroundColor: isActive ? primary : "transparent",
    color: isActive ? primaryText : "inherit",
    textAlign: "left",
    fontWeight: isActive ? "bold" : "normal",
    cursor: "pointer",
    fontSize: "0.95rem"
  });

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "6px",
    border: `1px solid ${border}`,
    backgroundColor: cardBg,
    color: text,
    fontSize: "1rem"
  };

  const btnStyle = (bgCol, txtCol) => ({
    padding: "12px 20px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: bgCol,
    color: txtCol,
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem"
  });

  const settingRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: cardBg,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    cursor: "pointer"
  };

  const errorBoxStyle = {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    color: "#991b1b",
    borderRadius: "6px"
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: bg, color: text, fontFamily: "system-ui, sans-serif", fontSize: largeText ? "18px" : "15px" }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: "260px", borderRight: `1px solid ${border}`, backgroundColor: sidebarBg, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: primary }}>⚡ Flashcards</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={() => setActiveTab("ai")} style={navButtonStyle(activeTab === "ai")}>
            ✨ AI Generator
          </button>
          <button onClick={() => setActiveTab("manual")} style={navButtonStyle(activeTab === "manual")}>
            ✍️ Manual Entry
          </button>
          <button onClick={() => setActiveTab("import")} style={navButtonStyle(activeTab === "import")}>
            📥 Import Deck
          </button>
          <button onClick={() => setActiveTab("settings")} style={navButtonStyle(activeTab === "settings")}>
            ⚙️ Settings & Access
          </button>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${border}`, margin: "0" }} />

        <div style={{ flex: 1, overflowY: "auto" }}>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: darkMode ? "#94a3b8" : "#64748b", marginBottom: "12px" }}>
            Saved Decks ({sets.length})
          </h3>
          {sets.length === 0 ? (
            <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>No saved decks yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {sets.map((set) => (
                <div
                  key={set.id}
                  onClick={() => {
                    setActiveDeckId(set.id);
                    setActiveTab("deck");
                    setFlippedCards({});
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: `1px solid ${activeDeckId === set.id && activeTab === "deck" ? primary : "transparent"}`,
                    backgroundColor: activeDeckId === set.id && activeTab === "deck" ? (darkMode ? "#334155" : "#eff6ff") : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                    {set.title}
                  </span>
                  <button
                    onClick={(e) => deleteDeck(set.id, e)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}
                    title="Delete Deck"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: "40px", maxWidth: "900px", margin: "0 auto" }}>

        {/* TAB 1: AI GENERATOR */}
        {activeTab === "ai" && (
          <div>
            <h1>✨ Generate Flashcards with AI</h1>
            <p style={{ opacity: 0.8 }}>Paste lecture notes, summary text, or study guides to auto-generate question cards.</p>

            <input
              type="text"
              placeholder="Deck Title (optional)"
              value={aiTitle}
              onChange={(e) => setAiTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              rows={8}
              placeholder="Paste study notes here..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              style={{ ...inputStyle, marginTop: "12px", width: "100%", boxSizing: "border-box" }}
            />

            <button
              onClick={handleAIGenerate}
              disabled={aiLoading}
              style={{ ...btnStyle(primary, primaryText), width: "100%", marginTop: "16px" }}
            >
              {aiLoading ? "Generating Flashcards..." : "Generate & Save Deck"}
            </button>

            {aiError && <div style={errorBoxStyle}>{aiError}</div>}
          </div>
        )}

        {/* TAB 2: MANUAL ENTRY */}
        {activeTab === "manual" && (
          <div>
            <h1>✍️ Manual Flashcard Creator</h1>
            <p style={{ opacity: 0.8 }}>Add terms and definitions one by one to build your custom deck.</p>

            <input
              type="text"
              placeholder="Deck Title (e.g. History Chapter 4)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
              <input
                type="text"
                placeholder="Term / Question"
                value={manualTerm}
                onChange={(e) => setManualTerm(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Definition / Answer"
                value={manualDef}
                onChange={(e) => setManualDef(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button onClick={handleAddManualCard} style={{ ...btnStyle(primary, primaryText), marginTop: "12px" }}>
              + Add Card
            </button>

            {manualCards.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h3>Cards to be saved ({manualCards.length}):</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", marginBottom: "16px" }}>
                  {manualCards.map((c, i) => (
                    <div key={i} style={{ padding: "10px", backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "6px" }}>
                      <strong>{c.question}</strong> — {c.answer}
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveManualDeck} style={{ ...btnStyle("#10b981", "#ffffff"), width: "100%" }}>
                  Save Complete Deck
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IMPORT FROM OTHER SITES */}
        {activeTab === "import" && (
          <div>
            <h1>📥 Import Deck from Text</h1>
            <p style={{ opacity: 0.8 }}>Copy export text from Quizlet, Anki, or spreadsheets and paste it below.</p>

            <input
              type="text"
              placeholder="Imported Deck Title"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              style={inputStyle}
            />

            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <label style={{ marginRight: "12px" }}>Term Separator:</label>
              <select
                value={termSeparator}
                onChange={(e) => setTermSeparator(e.target.value)}
                style={{ ...inputStyle, width: "auto" }}
              >
                <option value="tab">Tab (Quizlet Default)</option>
                <option value="comma">Comma (,)</option>
                <option value="dash">Hyphen (-)</option>
              </select>
            </div>

            <textarea
              rows={8}
              placeholder="Paste lines of terms and definitions here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />

            <button onClick={handleImport} style={{ ...btnStyle(primary, primaryText), width: "100%", marginTop: "16px" }}>
              Import Flashcards
            </button>
          </div>
        )}

        {/* TAB 4: SETTINGS & ACCESSIBILITY */}
        {activeTab === "settings" && (
          <div>
            <h1>⚙️ Settings & Accessibility</h1>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
              
              <label style={settingRowStyle}>
                <div>
                  <strong>Dark Mode</strong>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: "0.85rem" }}>Switch to dark background for lower eye strain.</p>
                </div>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => toggleDarkMode(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </label>

              <label style={settingRowStyle}>
                <div>
                  <strong>High Contrast Mode</strong>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: "0.85rem" }}>Enhances element borders and color contrast for visibility.</p>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => toggleHighContrast(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </label>

              <label style={settingRowStyle}>
                <div>
                  <strong>Large Text Scaling</strong>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: "0.85rem" }}>Increase overall font size throughout the app.</p>
                </div>
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => toggleLargeText(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </label>

            </div>
          </div>
        )}

        {/* DECK VIEW: FLIP FLASHCARDS */}
        {activeTab === "deck" && activeDeck && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h1>{activeDeck.title}</h1>
              <span style={{ opacity: 0.7 }}>{activeDeck.cards.length} Cards</span>
            </div>

            <p style={{ opacity: 0.7, marginBottom: "24px" }}>Click any card to flip between Question and Answer.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {activeDeck.cards.map((card, idx) => {
                const isFlipped = !!flippedCards[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleFlip(idx)}
                    style={{
                      backgroundColor: cardBg,
                      border: `2px solid ${isFlipped ? primary : border}`,
                      borderRadius: "12px",
                      minHeight: "160px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                      userSelect: "none"
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: primary, marginBottom: "8px", fontWeight: "bold" }}>
                      {isFlipped ? "Answer" : "Question"}
                    </span>
                    <p style={{ fontSize: "1.1rem", fontWeight: isFlipped ? "normal" : "600", margin: 0 }}>
                      {isFlipped ? card.answer : card.question}
                    </p>
                    <span style={{ fontSize: "0.7rem", opacity: 0.4, marginTop: "12px" }}>
                      Click to flip 🔄
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
