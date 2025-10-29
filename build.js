const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    }
};

// Copy file helper
const copyFile = (src, dest) => {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied: ${path.basename(src)} → ${dest}`);
        return true;
    } else {
        console.log(`⚠ Warning: ${src} not found, skipping...`);
        return false;
    }
};

console.log('🔨 Building project...\n');

// Create directory structure
createDir('public');
createDir('data');
createDir('views');

// Copy HTML files to public directory
console.log('\n📄 Copying HTML files to public/...');
copyFile('index.html', 'public/index.html');
copyFile('flashcards.html', 'public/flashcards.html');
copyFile('identify.html', 'public/identify.html');
copyFile('order.html', 'public/order.html');

// Also copy index.html to views for backward compatibility
console.log('\n📄 Copying index.html to views/ (for backward compatibility)...');
copyFile('index.html', 'views/index.html');

// Copy CSS files to public directory
console.log('\n🎨 Copying CSS files...');
copyFile('style.css', 'public/style.css');

// Copy JSON data files to data directory
console.log('\n📊 Copying data files...');
copyFile('flashcard.json', 'data/flashcard.json');
copyFile('formulaidentify.json', 'data/formulaidentify.json');
copyFile('orderquestion.json', 'data/orderquestion.json');

// Update JSON paths in HTML files
console.log('\n🔧 Updating file paths...');

const updatePaths = (filename) => {
    const filepath = path.join('public', filename);
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        
        // Update JSON file paths
        content = content.replace(/fetch\('flashcard\.json'\)/g, "fetch('/data/flashcard.json')");
        content = content.replace(/fetch\('formulaidentify\.json'\)/g, "fetch('/data/formulaidentify.json')");
        content = content.replace(/fetch\('orderquestion\.json'\)/g, "fetch('/data/orderquestion.json')");
        
        fs.writeFileSync(filepath, content);
        console.log(`✓ Updated paths in: ${filename}`);
    }
};

updatePaths('flashcards.html');
updatePaths('identify.html');
updatePaths('order.html');

console.log('\n✅ Build completed successfully!');
console.log('\n📦 Project structure:');
console.log('├── public/');
console.log('│   ├── index.html');
console.log('│   ├── flashcards.html');
console.log('│   ├── identify.html');
console.log('│   ├── order.html');
console.log('│   └── style.css');
console.log('├── views/');
console.log('│   └── index.html');
console.log('├── data/');
console.log('│   ├── flashcard.json');
console.log('│   ├── formulaidentify.json');
console.log('│   └── orderquestion.json');
console.log('└── server.js');
console.log('\n🚀 Run "npm start" to start the server');
console.log('📡 API endpoints available:');
console.log('   GET  /api/flashcards');
console.log('   POST /api/flashcards');