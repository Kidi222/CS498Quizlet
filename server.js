const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/__/firebase', express.static(path.join(__dirname, 'node_modules/firebase')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});