import { useEffect, useState } from "react";
import { db, type Note } from "./db";
import "./App.css";

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("General");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load notes from IndexedDB when the app opens.
  useEffect(() => {
    async function loadNotes() {
      try {
        const savedNotes = await db.notes.toArray();
        setNotes(savedNotes);
      } catch (err) {
        console.error("Could not load notes:", err);
        setError("Unable to load your notes. Please refresh and try again.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadNotes();
  }, []);

  // Search note titles, content and subjects.
  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content} ${note.subject}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Prepare a blank editor for a new note.
  function openNewNote() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSubject("General");
  }

  // Load an existing note into the editor.
  function openEditNote(note: Note) {
    if (note.id === undefined) return;

    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject);
  }

  // Save a new note or update an existing note.
  async function saveNote() {
    if (!title.trim()) {
      alert("Please enter a note title.");
      return;
    }

    setError("");

    const existingNote = notes.find(
      (note) => note.id === editingId
    );

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      subject: subject.trim() || "General",
      color: existingNote?.color ?? "lavender",
    };

    try {
      if (editingId !== null) {
        await db.notes.update(editingId, noteData);
      } else {
        await db.notes.add(noteData);
      }

      // Read the saved records back from IndexedDB.
      const updatedNotes = await db.notes.toArray();
      setNotes(updatedNotes);

      openNewNote();
    } catch (err) {
      console.error("Could not save note:", err);
      setError("Your note could not be saved. Please try again.");
    }
  }

  // Delete a note from IndexedDB.
  async function deleteNote(id: number | undefined) {
    if (id === undefined) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await db.notes.delete(id);

      const updatedNotes = await db.notes.toArray();
      setNotes(updatedNotes);

      if (editingId === id) {
        openNewNote();
      }
    } catch (err) {
      console.error("Could not delete note:", err);
      setError("Your note could not be deleted. Please try again.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✳</span>
          <span>StudySync</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <button className="nav-item active">
          ▤ <span>My Notes</span>
        </button>

        <button
          className="nav-item"
          onClick={() =>
            alert("Quizzes are coming in a later milestone!")
          }
        >
          ◉ <span>Quizzes</span>
        </button>

        <button
          className="nav-item"
          onClick={() =>
            alert("Your revision planner is coming soon!")
          }
        >
          ▦ <span>Study Planner</span>
        </button>

        <div className="sidebar-bottom">
          <div className="offline-indicator">
            <span className="status-dot" />
            <div>
              <strong>Study mode</strong>
              <small>Local workspace</small>
            </div>
          </div>

          <p className="sidebar-caption">
            Your learning space, organised.
          </p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace / <strong>My Notes</strong>
          </span>

          <span className="avatar">H</span>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR PERSONAL STUDY SPACE</p>

            <h1>
              Make room for <span>big ideas.</span>
            </h1>

            <p className="subtitle">
              All your learning, one calm space.
            </p>
          </div>

          <div className="welcome-decoration">✳</div>
        </section>

        <section className="notes-section">
          <div className="section-heading">
            <div>
              <h2>
                My notes <span className="count">{notes.length}</span>
              </h2>

              <p>Capture a thought before it slips away.</p>
            </div>

            <button
              className="primary-button"
              onClick={openNewNote}
            >
              <span>＋</span> New note
            </button>
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              aria-label="Search notes"
              placeholder="Search notes, subjects or keywords..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <kbd>SEARCH</kbd>
          </div>

          {isLoading && <p>Loading your notes...</p>}

          {error && (
            <p role="alert" style={{ color: "#b42318" }}>
              {error}
            </p>
          )}

          <div className="notes-grid">
            {!isLoading &&
              filteredNotes.map((note) => (
                <article
                  className={`note-card ${note.color}`}
                  key={note.id}
                >
                  <div className="note-card-top">
                    <span className="subject-tag">
                      {note.subject}
                    </span>

                    <div className="note-actions">
                      <button
                        aria-label={`Edit ${note.title}`}
                        onClick={() => openEditNote(note)}
                      >
                        ✎
                      </button>

                      <button
                        aria-label={`Delete ${note.title}`}
                        onClick={() => void deleteNote(note.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <h3>{note.title}</h3>

                  <p className="note-content">
                    {note.content || "No content yet."}
                  </p>

                  <button
                    className="edit-link"
                    onClick={() => openEditNote(note)}
                  >
                    Open note ↗
                  </button>
                </article>
              ))}

            {!isLoading && filteredNotes.length === 0 && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>
                  {search.trim()
                    ? "No notes found"
                    : "Your study space is ready"}
                </h3>
                <p>
                  {search.trim()
                    ? "Try another search or create a new note."
                    : "Create your first note to get started."}
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="app-footer">
          <span>Made for curious minds.</span>
          <span>StudySync · Early build</span>
        </footer>
      </main>

      <aside className="editor-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">QUICK EDITOR</p>

            <h2>
              {editingId === null
                ? "Create a note"
                : "Edit your note"}
            </h2>
          </div>

          <span className="editor-sparkle">✳</span>
        </div>

        <p className="editor-description">
          A little progress every day adds up.
        </p>

        <label htmlFor="note-title">NOTE TITLE</label>

        <input
          id="note-title"
          className="editor-input"
          placeholder="Give your note a name..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label htmlFor="note-subject">SUBJECT</label>

        <input
          id="note-subject"
          className="editor-input"
          placeholder="e.g. DSA, DBMS..."
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />

        <label htmlFor="note-content">YOUR THOUGHTS</label>

        <textarea
          id="note-content"
          className="editor-textarea"
          placeholder="Start writing here..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
        />

        <button
          className="primary-button save-button"
          onClick={() => void saveNote()}
          disabled={isLoading}
        >
          {editingId === null ? "Save note" : "Update note"}
          <span>↗</span>
        </button>

        <button
          className="cancel-button"
          onClick={openNewNote}
        >
          Clear editor
        </button>

        <div className="editor-tip">
          <span>✦</span>

          <div>
            <strong>Little reminder</strong>
            <p>
              You don't need to know everything today.
              Just keep showing up.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;