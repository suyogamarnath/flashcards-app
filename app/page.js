"use client";

import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  // Navigation & View States: 'library', 'study', 'settings'
  const [activeView, setActiveView] = useState("library");
  const [sets, setSets] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal & Creation Method States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationMethod, setCreationMethod] = useState(null); // 'terms_only' | 'ai_topic' | 'ai_notes' | 'import'

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Form Input States
  const [deckTitle, setDeckTitle] = useState("");
  const [termsInput, setTermsInput] = useState("");
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [importInput, setImportInput] = useState("");
  const [termSeparator, setTermSeparator] = useState("tab");
  const [cardCount, setCardCount] = useState(10);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Study Player States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load initial data
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
          // Default Sample Deck
          const sample = [
            {
              id: "demo-1",
              title: "Biology 101: Cell Structure",
              createdAt: new Date().toLocaleDateString(),
              cards: [
                { question: "Mitochondria", answer: "The powerhouse of the cell; produces ATP through cellular respiration." },
                { question: "Ribosome", answer: "Molecular machine that synthesizes proteins by translating mRNA." },
                { question: "Cell Membrane", answer: "Semi-permeable biological membrane separating interior from outside." },
                { question: "Golgi Apparatus", answer: "Modifies, sorts, and packages proteins for secretion or transport." }
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
      } catch (e) {
        console.error("Storage load error:", e);
      }
    }
  }, []);

  const saveSetsToStorage = (updatedSets) => {
    setSets(updatedSets);
    if (typeof window !== "undefined") {
      localStorage.setItem("knowt_flashcard_sets", JSON.stringify(updatedSets));
    }
  };

  const handleSaveDeck = (title, cards) => {
    if (!cards || !cards.length) return;
    const newDeck = {
      id: Date.now().toString(),
      title: title.trim() || `Untitled Deck (${new Date().toLocaleDateString()})`,
      cards: cards,
      createdAt: new Date().toLocaleDateString(),
    };
    const updated = [newDeck, ...sets];
    saveSetsToStorage(updated);
    setActiveDeckId(newDeck.id);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    resetForm();
    setIsCreateModalOpen(false);
    setActiveView("study");
  };

  const deleteDeck = (id, e) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && window.confirm("Delete this deck?")) {
      const updated = sets.filter((s) => s.id !== id);
      saveSetsToStorage(updated);
      if (activeDeckId === id) {
        setActiveDeckId(updated[0]?.id || null);
        setActiveView("library");
      }
    }
  };

  const resetForm = () => {
    setCreationMethod(null);
    setDeckTitle("");
    setTermsInput("");
    setAiTopicInput("");
    setNotesInput("");
    setImportInput("");
    setErrorMessage("");
    setIsLoading(false);
  };

  // 1. Terms Only -> Generate Definitions via AI
  const handleGenerateDefinitionsForTerms = async () => {
    if (!termsInput.trim()) return;
    setIsLoading(true);
    setErrorMessage("");

    const termsArray = termsInput.split("\n").map(t => t.trim()).filter(Boolean);
    const promptText = `Generate clear definitions for these terms:\n${termsArray.join("\n")}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: promptText, targetCount: termsArray.length }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to generate definitions.");
      } else if (data.flashcards && data.flashcards.length) {
        handleSaveDeck(deckTitle || "Terms Deck", data.flashcards);
      } else {
        setErrorMessage("Could not generate definitions. Try again.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to API.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. AI Topic Prompt -> Generate Terms & Definitions
  const handleGenerateTopicDeck = async () => {
    if (!aiTopicInput.trim()) return;
    setIsLoading(true);
    setErrorMessage("");

    const promptText = `Create key study flashcards on topic: ${aiTopicInput}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: promptText, targetCount: cardCount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to generate cards.");
      } else if (data.flashcards && data.flashcards.length) {
        handleSaveDeck(deckTitle || aiTopicInput, data.flashcards);
      } else {
        setErrorMessage("Could not generate cards for this topic.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to API.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Paste Notes -> Extract Terms & Definitions
  const handleGenerateFromNotes = async () => {
    if (!notesInput.trim()) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notesInput, targetCount: cardCount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to extract flashcards.");
      } else if (data.flashcards && data.flashcards.length) {
        handleSaveDeck(deckTitle || "Notes Deck", data.flashcards);
      } else {
        setErrorMessage("Could not parse cards from text. Try pasting more detailed notes.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to API.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Import Text parsing
  const handleImportText = () => {
    if (!importInput.trim()) return;
    let sep = "\t";
    if (termSeparator === "comma") sep = ",";
    if (termSeparator === "dash") sep = "-";

    const lines = importInput.split("\n");
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
      handleSaveDeck(deckTitle || "Imported Deck", parsed);
    } else {
      setErrorMessage("Unable to parse cards. Ensure text format matches the selected separator.");
    }
  };

  // Filtered decks based on Search Bar query
  const filteredSets = useMemo(() => {
    return sets.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sets, searchQuery]);

  const activeDeck = useMemo(() => sets.find((s) => s.id === activeDeckId), [sets, activeDeckId]);

  if (!mounted) return null;

  // Theme styling constants
  const bg = darkMode ? (highContrast ? "#000000" : "#0B0F17") : (highContrast ? "#FFFFFF" : "#F8FAFC");
  const surface = darkMode ? (highContrast ? "#121212" : "#1E293B") : "#FFFFFF";
  const border = highContrast ? (darkMode ? "#FFFFFF" : "#000000") : (darkMode ? "#334155" : "#E2E8F0");
  const text = darkMode ? "#F8FAFC" : "#0F172A";
  const mutedText = darkMode ? "#94A3B8" : "#64748B";
  const primary = highContrast ? (darkMode ? "#FFFF00" : "#0000FF") : "#4F46E5";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, color: text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* ================= TOP HEADER BAR ================= */}
      <header style={{ height: "68px", borderBottom: `1px solid ${border}`, backgroundColor: surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", gap: "20px", position: "sticky", top: 0, zIndex: 50 }}>
        
        {/* TOP LEFT: PROFILE */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setActiveView("library")}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: "700", fontSize: "0.95rem" }}>
            JD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "700", fontSize: "0.95rem", lineHeight: "1.2" }}>Alex Johnson</span>
            <span style={{ fontSize: "0.75rem", color: mutedText }}>Free Student Plan</span>
          </div>
        </div>

        {/* TOP CENTER: WIDE SEARCH BAR */}
        <div style={{ flex: 1, maxWidth: "600px", position: "relative" }}>
          <SearchIcon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: mutedText }} />
          <input
            type="text"
            placeholder="Search your flashcard sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 42px",
              borderRadius: "24px",
              border: `1px solid ${border}`,
              backgroundColor: bg,
              color: text,
              fontSize: "0.95rem",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* TOP RIGHT: + CREATE SET BUTTON & SETTINGS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: primary,
              color: "#FFFFFF",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "0.9rem",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)"
            }}
          >
            <span style={{ fontSize: "1.2rem", lineHeight: 0 }}>+</span>
            Create Set
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: "none", border: `1px solid ${border}`, padding: "8px 12px", borderRadius: "10px", color: text, cursor: "pointer", fontSize: "0.85rem" }}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT VIEW ================= */}
      <main style={{ padding: "40px 28px", maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* VIEW 1: LIBRARY (GRID OF SETS) */}
        {activeView === "library" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>Your Study Sets</h1>
              <span style={{ color: mutedText, fontSize: "0.9rem", fontWeight: "600" }}>{filteredSets.length} Sets Total</span>
            </div>

            {filteredSets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: surface, borderRadius: "16px", border: `1px solid ${border}` }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>No sets found</h3>
                <p style={{ color: mutedText, marginBottom: "20px" }}>{searchQuery ? "Try searching for another keyword" : "Create your first flashcard set to get started"}</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ backgroundColor: primary, color: "#FFF", border: "none", padding: "12px 24px", borderRadius: "20px", fontWeight: "700", cursor: "pointer" }}
                >
                  + Create First Set
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {filteredSets.map((deck) => (
                  <div
                    key={deck.id}
                    onClick={() => {
                      setActiveDeckId(deck.id);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setActiveView("study");
                    }}
                    style={{
                      backgroundColor: surface,
                      borderRadius: "14px",
                      border: `1px solid ${border}`,
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "140px",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 6px 0", wordBreak: "break-word" }}>{deck.title}</h3>
                        <button
                          onClick={(e) => deleteDeck(deck.id, e)}
                          style={{ border: "none", background: "none", color: mutedText, cursor: "pointer", padding: "4px" }}
                          title="Delete Deck"
                        >
                          ✕
                        </button>
                      </div>
                      <span style={{ fontSize: "0.8rem", backgroundColor: darkMode ? "#312E81" : "#EEF2FF", color: primary, fontWeight: "700", padding: "4px 10px", borderRadius: "12px", display: "inline-block" }}>
                        {deck.cards.length} Cards
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: mutedText, marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Created: {deck.createdAt}</span>
                      <span style={{ fontWeight: "700", color: primary }}>Study →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STUDY PLAYER (KNOWT 3D FLIP STYLE) */}
        {activeView === "study" && activeDeck && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            
            <button
              onClick={() => setActiveView("library")}
              style={{ background: "none", border: "none", color: primary, fontWeight: "700", cursor: "pointer", marginBottom: "16px", padding: 0 }}
            >
              ← Back to My Sets
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>{activeDeck.title}</h1>
              <span style={{ color: mutedText, fontWeight: "600" }}>{activeDeck.cards.length} Cards</span>
            </div>

            {/* PROGRESS BAR */}
            <div style={{ width: "100%", height: "6px", backgroundColor: darkMode ? "#334155" : "#E2E8F0", borderRadius: "3px", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ height: "100%", backgroundColor: primary, width: `${((currentCardIndex + 1) / activeDeck.cards.length) * 100}%`, transition: "width 0.3s ease" }} />
            </div>

            {/* 3D FLASHCARD PLAYER */}
            <div style={{ perspective: "1000px", marginBottom: "20px" }}>
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "350px",
                  backgroundColor: surface,
                  borderRadius: "16px",
                  border: `2px solid ${border}`,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                  textAlign: "center",
                  transition: "transform 0.4s ease",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  userSelect: "none",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ position: "absolute", top: "20px", left: "24px", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: mutedText, textTransform: "uppercase" }}>
                  {isFlipped ? "DEFINITION" : "TERM"}
                </div>
                
                <div style={{ fontSize: "1.4rem", fontWeight: isFlipped ? "400" : "600", lineHeight: "1.6", maxWidth: "85%", transform: isFlipped ? "rotateY(180deg)" : "none" }}>
                  {isFlipped ? activeDeck.cards[currentCardIndex]?.answer : activeDeck.cards[currentCardIndex]?.question}
                </div>

                <div style={{ position: "absolute", bottom: "20px", fontSize: "0.8rem", color: mutedText, transform: isFlipped ? "rotateY(180deg)" : "none" }}>
                  Click card to flip 🔄
                </div>
              </div>
            </div>

            {/* NAV CONTROLS */}
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

              <span style={{ fontWeight: "700", color: mutedText }}>
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

          </div>
        )}

      </main>

      {/* ================= CREATE SET MODAL & PROMPTS ================= */}
      {isCreateModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          
          <div style={{ backgroundColor: surface, borderRadius: "20px", border: `1px solid ${border}`, width: "100%", maxWidth: "680px", padding: "32px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0 }}>
                {creationMethod ? "Configure Flashcard Set" : "Create a New Set"}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: mutedText, cursor: "pointer" }}>✕</button>
            </div>

            {/* OPTION SELECTION GRID (SHOW WHEN NO METHOD CHOSEN YET) */}
            {!creationMethod && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                
                <MethodCard
                  title="📝 Terms Only"
                  desc="Type or paste your list of terms and AI will generate definitions for you."
                  onClick={() => setCreationMethod("terms_only")}
                  border={border}
                  bg={bg}
                />

                <MethodCard
                  title="🤖 AI Topic / Prompt"
                  desc="Enter any topic or concept to generate terms and definitions."
                  onClick={() => setCreationMethod("ai_topic")}
                  border={border}
                  bg={bg}
                />

                <MethodCard
                  title="📄 Paste Notes / Reading"
                  desc="Paste lecture notes, articles, or summaries to auto-extract flashcards."
                  onClick={() => setCreationMethod("ai_notes")}
                  border={border}
                  bg={bg}
                />

                <MethodCard
                  title="📥 Manual Import"
                  desc="Import flashcards directly from Quizlet, Anki, or CSV/Text lines."
                  onClick={() => setCreationMethod("import")}
                  border={border}
                  bg={bg}
                />

              </div>
            )}

            {/* METHOD 1: TERMS ONLY */}
            {creationMethod === "terms_only" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="Deck Title (e.g. Organic Chem Terms)"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <textarea
                  rows={6}
                  placeholder="Enter terms (one per line)...&#10;Mitochondria&#10;Ribosome&#10;Chloroplast"
                  value={termsInput}
                  onChange={(e) => setTermsInput(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <ActionButtons
                  onBack={() => setCreationMethod(null)}
                  onSubmit={handleGenerateDefinitionsForTerms}
                  isLoading={isLoading}
                  submitText="Generate Definitions ✨"
                  primary={primary}
                />
              </div>
            )}

            {/* METHOD 2: AI TOPIC / PROMPT */}
            {creationMethod === "ai_topic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="Deck Title (Optional)"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <input
                  type="text"
                  placeholder="Topic / Prompt (e.g. World War II Key Battles)"
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Cards to generate:</label>
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
                <ActionButtons
                  onBack={() => setCreationMethod(null)}
                  onSubmit={handleGenerateTopicDeck}
                  isLoading={isLoading}
                  submitText="Generate Cards ✨"
                  primary={primary}
                />
              </div>
            )}

            {/* METHOD 3: PASTE NOTES */}
            {creationMethod === "ai_notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="Deck Title"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <textarea
                  rows={8}
                  placeholder="Paste lecture text or reading materials here..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  style={inputStyle(border, bg, text)}
                />
                <ActionButtons
                  onBack={() => setCreationMethod(null)}
                  onSubmit={handleGenerateFromNotes}
                  isLoading={isLoading}
                  submitText="Extract Cards ✨"
                  primary={primary}
                />
              </div>
            )}

            {/* METHOD 4: IMPORT TEXT */}
            {creationMethod === "import" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="Deck Title"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  style={inputStyle(border, bg, text)}
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
                  rows={7}
                  placeholder={"Term 1\tDefinition 1\nTerm 2\tDefinition 2"}
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  style={{ ...inputStyle(border, bg, text), fontFamily: "monospace" }}
                />
                <ActionButtons
                  onBack={() => setCreationMethod(null)}
                  onSubmit={handleImportText}
                  isLoading={isLoading}
                  submitText="Import Flashcards"
                  primary={primary}
                />
              </div>
            )}

            {errorMessage && (
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: "10px", fontSize: "0.9rem" }}>
                {errorMessage}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// HELPER COMPONENTS
function MethodCard({ title, desc, onClick, border, bg }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "20px",
        borderRadius: "14px",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transition: "transform 0.15s ease",
      }}
    >
      <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{title}</div>
      <div style={{ fontSize: "0.85rem", opacity: 0.7, lineHeight: "1.4" }}>{desc}</div>
    </div>
  );
}

function ActionButtons({ onBack, onSubmit, isLoading, submitText, primary }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
      <button onClick={onBack} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", fontWeight: "600" }}>
        ← Back
      </button>
      <button
        onClick={onSubmit}
        disabled={isLoading}
        style={{ padding: "12px 24px", borderRadius: "12px", border: "none", backgroundColor: primary, color: "#FFF", fontWeight: "700", cursor: isLoading ? "wait" : "pointer" }}
      >
        {isLoading ? "Processing..." : submitText}
      </button>
    </div>
  );
}

const inputStyle = (border, bg, text) => ({
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: `1px solid ${border}`,
  backgroundColor: bg,
  color: text,
  fontSize: "0.95rem",
  boxSizing: "border-box"
});

function SearchIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
