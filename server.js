const express = require('express');
const path = require('path');
const fs = require("fs");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve JSON data files
app.use('/data', express.static(path.join(__dirname, 'data')));

// Firebase support (if needed)
app.use('/__/firebase', express.static(path.join(__dirname, 'node_modules/firebase')));

// Serve views directory (for backward compatibility)
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route for home page (supports both /views/index.html and public/index.html)
app.get('/', (req, res) => {
    const viewsIndex = path.join(__dirname, 'views', 'index.html');
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    
    // Check if views/index.html exists, otherwise use public/index.html
    const fs = require('fs');
    if (fs.existsSync(viewsIndex)) {
        res.sendFile(viewsIndex);
    } else {
        res.sendFile(publicIndex);
    }
});

// Route for flashcards
app.get('/flashcards', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'flashcards.html'));
});

// Route for identify game
app.get('/identify', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'identify.html'));
});

// Route for order game
app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// API routes for Quizlet functionality
app.get('/api/flashcards', (req, res) => {
    // Mock data - in a real app, this would come from a database
    res.json([
        { id: 1, term: 'HTML', definition: 'HyperText Markup Language' },
        { id: 2, term: 'CSS', definition: 'Cascading Style Sheets' },
        { id: 3, term: 'JavaScript', definition: 'A programming language that enables interactive web pages' }
    ]);
});

app.post('/api/flashcards', (req, res) => {
    // In a real app, this would save to a database
    const { term, definition } = req.body;
    
    if (!term || !definition) {
        return res.status(400).json({ error: 'Term and definition are required' });
    }
    
    // Mock response
    res.status(201).json({ 
        id: Date.now(),
        term,
        definition,
        message: 'Flashcard created successfully' 
    });
});

// ===== Study Sets API =====

// Folder to store JSON files
const studySetsDir = path.join(__dirname, "public", "studySets");

// Ensure folder exists
if (!fs.existsSync(studySetsDir)) fs.mkdirSync(studySetsDir, { recursive: true });

// Helper to get all study sets
function loadAllStudySets() {
  const files = fs.readdirSync(studySetsDir).filter(f => f.endsWith(".json"));
  return files.map(filename => {
    const filePath = path.join(studySetsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { id: path.parse(filename).name, ...data };
  });
}

// === GET all study sets ===
app.get("/api/studySets", (req, res) => {
  try {
    const sets = loadAllStudySets();
    res.json(sets);
  } catch (err) {
    console.error("Error loading study sets:", err);
    res.status(500).json({ error: "Failed to load study sets" });
  }
});

// === POST create new study set ===
app.post("/api/studySets", (req, res) => {
  try {
    const { title, description, cards } = req.body;
    if (!title || !cards) {
      return res.status(400).json({ error: "Title and cards required" });
    }

    const id = Date.now().toString();
    const filePath = path.join(studySetsDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ title, description, cards }, null, 2));
    res.status(201).json({ id, message: "Study set created" });
  } catch (err) {
    console.error("Error creating study set:", err);
    res.status(500).json({ error: "Failed to create study set" });
  }
});

// === PUT update study set ===
app.put("/api/studySets/:id", (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(studySetsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

    const { title, description, cards } = req.body;
    fs.writeFileSync(filePath, JSON.stringify({ title, description, cards }, null, 2));
    res.json({ message: "Study set updated" });
  } catch (err) {
    console.error("Error updating study set:", err);
    res.status(500).json({ error: "Failed to update study set" });
  }
});

// === DELETE study set ===
app.delete("/api/studySets/:id", (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(studySetsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

    fs.unlinkSync(filePath);
    res.json({ message: "Study set deleted" });
  } catch (err) {
    console.error("Error deleting study set:", err);
    res.status(500).json({ error: "Failed to delete study set" });
  }
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});