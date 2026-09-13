"use client";

import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("ai"); // 'ai', 'decks', 'manual', 'import', 'settings', 'study'
  const [sets, setSets] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);

  // Accessibility & Theme States
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Study Mode Player States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState({});

  // AI Generator States
  const [aiTitle, setAiTitle] = useState("");
  const [aiText, setAiText] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Manual Creation States
  const [manualTitle, setManualTitle] = useState("");
  const [manualTerm, setManualTerm] = useState("");
  const [manualDef, setManualDef] = useState("");
  const [manualCards, setManualCards] = useState([]);

  // Import States
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");
  const [termSeparator, setTermSeparator] = useState("tab");

  // Load saved preferences and decks
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const savedSets = localStorage.getItem("knowt_flashcard_sets");
        if (savedSets) {
          const parsed = JSON.parse(savedSets);
          setSets(parsed);
          if (parsed.length > 0) setActiveDeckId(parsed[0].id);
        } else {
          // Default Sample Deck like Knowt
          const sample = [
            {
              id: "demo-1",
              title: "Biology 101: Cell Structure",
              createdAt: new Date().toISOString(),
              cards: [
                { question: "Mitochondria", answer: "The powerhouse of the cell; produces ATP through cellular respiration." },
                { question: "Ribosome", answer: "Molecular machine that synthesizes proteins by translating messenger RNA." },
                { question: "Endoplasmic Reticulum", answer: "Network of membranes involved in protein folding and lipid synthesis." },
                { question: "Cell Membrane", answer: "Semi-permeable biological membrane separating interior from outside environment." }
              ]
            }
          ];
          setSets(sample);
          setActiveDeckId("demo-1");
        }
        const dark = localStorage.getItem("knowt_dark");
        if (dark !== null) setDarkMode(JSON.parse(dark));
        const contrast = localStorage.getItem("knowt_contrast");
        if (contrast !== null) setHighContrast(JSON.parse(contrast));
        const large = localStorage.getItem("knowt_large");
        if (large !== null) setLargeText(JSON.parse(large));
      } catch (e) {
        console.error("Storage load error:", e);
      }
    }
  }, []);

  const saveSets = (updatedSets) => {
    setSets(updatedSets);
    if (typeof window !== "undefined") {
      localStorage.setItem("knowt_flashcard_sets", JSON.stringify(updatedSets));
    }
  };

  const createDeck = (title, cards) => {
    if (!cards || !cards.length) return;
    const newDeck = {
      id: Date.now().toString(),
      title: title.trim() || `Untitled Deck (${new Date().toLocaleDateString()})`,
      cards: cards,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDeck, ...sets];
    saveSets(updated);
    setActiveDeckId(newDeck.id);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setActiveTab("study");
  };

  const deleteDeck = (id, e) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && window.confirm("Delete this deck?")) {
      const updated = sets.filter((s) => s.id !== id);
      saveSets(updated);
      if (activeDeckId === id) {
        setActiveDeckId(updated[0]?.id || null);
        setActiveTab(updated.length ? "study" : "ai");
      }
    }
  };

  const handleAIGenerate = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText, targetCount: cardCount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || "Failed to generate deck.");
      } else if (data.flashcards && data.flashcards.length) {
        createDeck(aiTitle || "AI Flashcards", data.flashcards);
        setAiText("");
        setAiTitle("");
      } else {
        setAiError("Could not extract flashcards. Try pasting more detailed study notes.");
      }
    } catch (err) {
      setAiError("Network connection error. Check your API route.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    let sep = "\t";
    if (termSeparator === "comma") sep = ",";
    if (termSeparator === "dash") sep = "-";

    const lines = importText.split("\n");
    const parsed = [];
    lines.forEach((line) => {
      const parts = line.split(sep);
      if (parts.length >= 2) {
        const question = parts[0].trim();
        const answer = parts.slice(1).join(sep).trim();
        if (question && answer) parsed.push({ question, answer });
      }
    });

    if (parsed.length > 0) {
      createDeck(importTitle || "Imported Deck", parsed);
      setImportText("");
      setImportTitle("");
    } else {
      alert("Unable to parse text. Make sure your lines use the chosen term separator.");
    }
  };

  const activeDeck = useMemo(() => sets.find((s) => s.id === activeDeckId), [sets, activeDeckId]);

  if (!mounted) return null;

  // Theme variables (Knowt aesthetic: crisp backgrounds, vibrant indigo accents, refined borders)
  const bg = darkMode ? (highContrast ? "#000000" : "#0B0F17") : (highContrast ? "#FFFFFF" : "#F8FAFC");
  const surface = darkMode ? (highContrast ? "#121212" : "#1E293B") : "#FFFFFF";
  const border = highContrast ? (darkMode ? "#FFFFFF" : "#000000") : (darkMode ? "#334155" : "#E2E8F0");
  const text = darkMode ? "#F8FAFC" : "#0F172A";
  const mutedText = darkMode ? "#94A3B8" : "#64748B";
  const primary = highContrast ? (darkMode ? "#FFFF00" : "#0000FF") : "#4F46E5";
  const primaryHover = darkMode ? "#6366F1" : "#4338CA";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, color: text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: largeText ? "18px" : "15px", display: "flex", flexDirection: "column" }}>
      
      {/* KNOWT TOP NAVBAR */}
      <header style={{ height: "64px", borderBottom: `1px solid ${border}`, backgroundColor: surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setActiveTab(sets.length ? "study" : "ai")}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: "800", fontSize: "18px" }}>
            K
          </div>
          <span style={{ fontWeight: "700", fontSize: "1.2rem", letterSpacing: "-0.5px" }}>Knowt Study</span>
          <span style={{ fontSize: "0.75rem", backgroundColor: darkMode ? "#312E81" : "#EEF2FF", color: primary, fontWeight: "600", padding: "3px 8px", borderRadius: "12px" }}>PRO</span>
        </div>

        {/* TOP ACTION PILLS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setActiveTab("ai")}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: primary, color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Create with AI
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER (SIDEBAR + CONTENT) */}
      <div style={{ flex: 1, display: "flex" }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside style={{ width: "260px", borderRight: `1px solid ${border}`, backgroundColor: surface, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <SidebarItem label="AI Generator" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} icon={<SparkleIcon color={primary} />} />
            <SidebarItem label="My Decks" active={activeTab === "study" || activeTab === "decks"} onClick={() => setActiveTab("study")} icon={<BookIcon color={primary} />} />
            <SidebarItem label="Manual Entry" active={activeTab === "manual"} onClick={() => setActiveTab("manual")} icon={<EditIcon color={primary} />} />
            <SidebarItem label="Import Text" active={activeTab === "import"} onClick={() => setActiveTab("import")} icon={<ImportIcon color={primary} />} />
            <SidebarItem label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<SettingsIcon color={primary} />} />
          </div>

          <div style={{ borderTop: `1px solid ${border}`, paddingTop: "16px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: mutedText, letterSpacing: "0.5px", marginBottom: "12px", padding: "0 8px" }}>
              Library ({sets.length})
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {sets.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => {
                    setActiveDeckId(deck.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setActiveTab("study");
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: activeDeckId === deck.id && activeTab === "study" ? (darkMode ? "#312E81" : "#EEF2FF") : "transparent",
                    color: activeDeckId === deck.id && activeTab === "study" ? primary : text,
                    fontWeight: activeDeckId === deck.id && activeTab === "study" ? "600" : "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{deck.title}</span>
                  <button onClick={(e) => deleteDeck(deck.id, e)} style={{ border: "none", background: "none", color: mutedText, cursor: "pointer", padding: "2px 6px" }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main style={{ flex: 1, padding: "32px 48px", overflowY: "auto", maxWidth: "1000px", margin: "0 auto" }}>
          
          {/* TAB 1: KNOWT STUDY MODE PLAYER */}
          {activeTab === "study" && (
            <div>
              {activeDeck ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* DECK HEADER BAR */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>{activeDeck.title}</h1>
                      <p style={{ margin: "4px 0 0 0", color: mutedText, fontSize: "0.9rem" }}>{activeDeck.cards.length} Flashcards • Knowt Learn Mode</p>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{ width: "100%", height: "6px", backgroundColor: darkMode ? "#334155" : "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: primary, width: `${((currentCardIndex + 1) / activeDeck.cards.length) * 100}%`, transition: "width 0.3s ease" }} />
                  </div>

                  {/* 3D FLASHCARD CONTAINER */}
                  <div style={{ perspective: "1000px", margin: "10px 0" }}>
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      style={{
                        position: "relative",
                        width: "100%",
                        minHeight: "340px",
                        backgroundColor: surface,
                        borderRadius: "16px",
                        border: `2px solid ${border}`,
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "40px",
                        textAlign: "center",
                        transition: "transform 0.4s ease, border-color 0.2s ease",
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        userSelect: "none"
                      }}
                    >
                      <div style={{ position: "absolute", top: "20px", left: "24px", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: mutedText, textTransform: "uppercase" }}>
                        {isFlipped ? "DEFINITION" : "TERM"}
                      </div>
                      
                      <div style={{ fontSize: "1.4rem", fontWeight: isFlipped ? "400" : "600", lineHeight: "1.6", maxWidth: "80%", transform: isFlipped ? "rotateY(180deg)" : "none" }}>
                        {isFlipped ? activeDeck.cards[currentCardIndex]?.answer : activeDeck.cards[currentCardIndex]?.question}
                      </div>

                      <div style={{ position: "absolute", bottom: "20px", fontSize: "0.8rem", color: mutedText, transform: isFlipped ? "rotateY(180deg)" : "none" }}>
                        Click card or press Space to flip 🔄
                      </div>
                    </div>
                  </div>

                  {/* PLAYER CONTROLS */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : activeDeck.cards.length - 1));
                      }}
                      style={{ padding: "12px 24px", borderRadius: "12px", border: `1px solid ${border}`, backgroundColor: surface, color: text, fontWeight: "600", cursor: "pointer" }}
                    >
                      ← Previous
                    </button>

                    <span style={{ fontWeight: "600", color: mutedText }}>
                      {currentCardIndex + 1} / {activeDeck.cards.length}
                    </span>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) => (prev < activeDeck.cards.length - 1 ? prev + 1 : 0));
                      }}
                      style={{ padding: "12px 24px", borderRadius: "12px", border: `1px solid ${border}`, backgroundColor: surface, color: text, fontWeight: "600", cursor: "pointer" }}
                    >
                      Next →
                    </button>
                  </div>

                  {/* CARDS LIST BREAKDOWN */}
                  <div style={{ marginTop: "32px", borderTop: `1px solid ${border}`, paddingTop: "24px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>Terms in this set ({activeDeck.cards.length})</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {activeDeck.cards.map((card, idx) => (
                        <div key={idx} style={{ padding: "16px 20px", borderRadius: "12px", border: `1px solid ${border}`, backgroundColor: surface, display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                          <div style={{ fontWeight: "600", borderRight: `1px solid ${border}`, paddingRight: "16px" }}>{card.question}</div>
                          <div style={{ color: mutedText }}>{card.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <h2>No Decks Found</h2>
                  <p style={{ color: mutedText }}>Create your first flashcard set using the AI Generator.</p>
                  <button onClick={() => setActiveTab("ai")} style={{ backgroundColor: primary, color: "#FFF", border: "none", padding: "12px 24px", borderRadius: "20px", fontWeight: "600", cursor: "pointer", marginTop: "16px" }}>
                    Create with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI GENERATOR (KNOWT KAI STYLE) */}
          {activeTab === "ai" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <span style={{ color: primary, fontWeight: "700", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>AI Flashcard Creator</span>
                <h1 style={{ fontSize: "2rem", fontWeight: "800", marginTop: "4px" }}>Transform Notes into Flashcards</h1>
                <p style={{ color: mutedText }}>Paste text, summaries, or lecture notes below and Kai AI will generate cards in seconds.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", backgroundColor: surface, padding: "24px", borderRadius: "16px", border: `1px solid ${border}` }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>Deck Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AP US History - Chapter 4"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: "0.95rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>Study Material</label>
                  <textarea
                    rows={8}
                    placeholder="Paste lecture notes, textbook summaries, or articles here..."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: "0.95rem", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", marginRight: "12px" }}>Target Card Count:</label>
                    <select
                      value={cardCount}
                      onChange={(e) => setCardCount(Number(e.target.value))}
                      style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                    >
                      <option value={5}>5 Cards</option>
                      <option value={10}>10 Cards</option>
                      <option value={15}>15 Cards</option>
                      <option value={20}>20 Cards</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAIGenerate}
                    disabled={aiLoading}
                    style={{ backgroundColor: primary, color: "#FFF", border: "none", padding: "12px 28px", borderRadius: "12px", fontWeight: "700", cursor: aiLoading ? "wait" : "pointer", fontSize: "0.95rem" }}
                  >
                    {aiLoading ? "Generating..." : "Generate Flashcards ✨"}
                  </button>
                </div>

                {aiError && (
                  <div style={{ padding: "12px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: "10px", fontSize: "0.9rem" }}>
                    {aiError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL CREATION */}
          {activeTab === "manual" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "8px" }}>Manual Flashcard Creator</h1>
              <p style={{ color: mutedText, marginBottom: "24px" }}>Add cards manually term by term.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", backgroundColor: surface, padding: "24px", borderRadius: "16px", border: `1px solid ${border}` }}>
                <input
                  type="text"
                  placeholder="Deck Title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Term (Question)"
                    value={manualTerm}
                    onChange={(e) => setManualTerm(e.target.value)}
                    style={{ padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                  />
                  <input
                    type="text"
                    placeholder="Definition (Answer)"
                    value={manualDef}
                    onChange={(e) => setManualDef(e.target.value)}
                    style={{ padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!manualTerm.trim() || !manualDef.trim()) return;
                    setManualCards([...manualCards, { question: manualTerm.trim(), answer: manualDef.trim() }]);
                    setManualTerm("");
                    setManualDef("");
                  }}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: `1px solid ${primary}`, color: primary, backgroundColor: "transparent", fontWeight: "600", cursor: "pointer" }}
                >
                  + Add Card
                </button>

                {manualCards.length > 0 && (
                  <div style={{ marginTop: "16px", borderTop: `1px solid ${border}`, paddingTop: "16px" }}>
                    <div style={{ fontWeight: "700", marginBottom: "12px" }}>Queued Cards ({manualCards.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                      {manualCards.map((c, i) => (
                        <div key={i} style={{ padding: "8px 12px", backgroundColor: bg, borderRadius: "8px", border: `1px solid ${border}`, fontSize: "0.9rem" }}>
                          <strong>{c.question}</strong> — {c.answer}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        createDeck(manualTitle || "Manual Deck", manualCards);
                        setManualCards([]);
                        setManualTitle("");
                      }}
                      style={{ marginTop: "16px", width: "100%", padding: "12px", backgroundColor: primary, color: "#FFF", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
                    >
                      Save Deck
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT */}
          {activeTab === "import" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "8px" }}>Import from Quizlet or Text</h1>
              <p style={{ color: mutedText, marginBottom: "24px" }}>Copy lines from Quizlet, Anki, or Excel and paste below.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", backgroundColor: surface, padding: "24px", borderRadius: "16px", border: `1px solid ${border}` }}>
                <input
                  type="text"
                  placeholder="Imported Deck Title"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Separator:</label>
                  <select
                    value={termSeparator}
                    onChange={(e) => setTermSeparator(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${border}`, backgroundColor: bg, color: text }}
                  >
                    <option value="tab">Tab (Quizlet Default)</option>
                    <option value="comma">Comma (,)</option>
                    <option value="dash">Hyphen (-)</option>
                  </select>
                </div>

                <textarea
                  rows={8}
                  placeholder={"Term 1\tDefinition 1\nTerm 2\tDefinition 2"}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${border}`, backgroundColor: bg, color: text, fontFamily: "monospace", fontSize: "0.9rem" }}
                />

                <button onClick={handleImport} style={{ padding: "12px", backgroundColor: primary, color: "#FFF", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                  Import Flashcards
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "24px" }}>Settings & Preferences</h1>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <SettingRow
                  label="Dark Mode"
                  desc="Dark gray and indigo theme interface"
                  checked={darkMode}
                  onChange={(val) => {
                    setDarkMode(val);
                    localStorage.setItem("knowt_dark", JSON.stringify(val));
                  }}
                  surface={surface}
                  border={border}
                />
                <SettingRow
                  label="High Contrast"
                  desc="High visibility contrast for terms and text"
                  checked={highContrast}
                  onChange={(val) => {
                    setHighContrast(val);
                    localStorage.setItem("knowt_contrast", JSON.stringify(val));
                  }}
                  surface={surface}
                  border={border}
                />
                <SettingRow
                  label="Large Text Scaling"
                  desc="Enlarge all fonts across the flashcard viewer"
                  checked={largeText}
                  onChange={(val) => {
                    setLargeText(val);
                    localStorage.setItem("knowt_large", JSON.stringify(val));
                  }}
                  surface={surface}
                  border={border}
                />
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

// UI HELPER COMPONENTS
function SidebarItem({ label, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: active ? "rgba(79, 70, 229, 0.1)" : "transparent",
        color: active ? "#4F46E5" : "inherit",
        fontWeight: active ? "700" : "500",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontSize: "0.95rem"
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SettingRow({ label, desc, checked, onChange, surface, border }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", backgroundColor: surface, border: `1px solid ${border}`, borderRadius: "12px" }}>
      <div>
        <div style={{ fontWeight: "700" }}>{label}</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{desc}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "20px", height: "20px", cursor: "pointer" }}
      />
    </div>
  );
}

// INLINE CLEAN SVG ICONS
function SparkleIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>;
}
function BookIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function EditIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function ImportIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function SettingsIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
