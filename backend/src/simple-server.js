const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockNotes = [
  {
    id: "1",
    title: "React Hooks Best Practices",
    content:
      "Here are some essential best practices when working with React Hooks:\n\n1. Always call hooks at the top level\n2. Use useCallback for expensive functions\n3. Optimize with useMemo for heavy calculations\n4. Custom hooks for reusable logic",
    category: "React",
    tags: ["react", "hooks", "best-practices", "javascript"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    published: true,
  },
  {
    id: "2",
    title: "TypeScript Utility Types",
    content:
      "TypeScript provides several utility types that make working with types easier:\n\nPartial<T> - Makes all properties optional\nRequired<T> - Makes all properties required\nPick<T, K> - Creates a type with selected properties\nOmit<T, K> - Creates a type without specified properties",
    category: "TypeScript",
    tags: ["typescript", "types", "utilities"],
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
    published: true,
  },
  {
    id: "3",
    title: "CSS Grid Layout Patterns",
    content:
      "Common CSS Grid patterns that are useful for modern web layouts:\n\n1. Holy Grail Layout\n2. Card Grid with Auto-fit\n3. Sidebar Layout\n4. Magazine Layout\n\nEach pattern solves specific layout challenges.",
    category: "CSS",
    tags: ["css", "grid", "layout", "responsive"],
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    published: true,
  },
];

const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
};

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Auth routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Mock authentication - accept any email/password
  if (email && password) {
    res.json({
      user: { ...mockUser, email },
      token: "mock-jwt-token",
    });
  } else {
    res.status(400).json({ error: "Email and password required" });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  // Mock registration - accept any valid data
  if (name && email && password) {
    res.json({
      user: { id: "1", name, email },
      token: "mock-jwt-token",
    });
  } else {
    res.status(400).json({ error: "Name, email and password required" });
  }
});

// Notes routes
app.get("/api/notes", (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  let filteredNotes = [...mockNotes];

  // Filter by search term (title and content)
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredNotes = filteredNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by category
  if (category && category !== "all") {
    filteredNotes = filteredNotes.filter(
      (note) => note.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Sort by creation date (newest first)
  filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedNotes = filteredNotes.slice(startIndex, endIndex);

  res.json({
    notes: paginatedNotes,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(filteredNotes.length / limitNum),
      totalItems: filteredNotes.length,
      itemsPerPage: limitNum,
      hasNextPage: endIndex < filteredNotes.length,
      hasPrevPage: pageNum > 1,
    },
  });
});

app.get("/api/notes/:id", (req, res) => {
  const note = mockNotes.find((n) => n.id === req.params.id);
  if (note) {
    res.json(note);
  } else {
    res.status(404).json({ error: "Note not found" });
  }
});

app.post("/api/notes", (req, res) => {
  const { title, content, category, tags } = req.body;

  const newNote = {
    id: String(mockNotes.length + 1),
    title,
    content,
    category,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
  };

  mockNotes.push(newNote);
  res.status(201).json(newNote);
});

app.put("/api/notes/:id", (req, res) => {
  const { title, content, category, tags } = req.body;
  const noteIndex = mockNotes.findIndex((n) => n.id === req.params.id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found" });
  }

  mockNotes[noteIndex] = {
    ...mockNotes[noteIndex],
    title,
    content,
    category,
    tags: tags || [],
    updatedAt: new Date().toISOString(),
  };

  res.json(mockNotes[noteIndex]);
});

app.delete("/api/notes/:id", (req, res) => {
  const noteIndex = mockNotes.findIndex((n) => n.id === req.params.id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found" });
  }

  mockNotes.splice(noteIndex, 1);
  res.status(204).send();
});

// Get all unique categories
app.get("/api/categories", (req, res) => {
  const categories = [...new Set(mockNotes.map((note) => note.category))];
  res.json(categories);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  API: http://localhost:${PORT}/api`);
});
