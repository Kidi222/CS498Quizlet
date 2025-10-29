const express = require('express');
const path = require('path');
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

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});