// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');


const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root route - redirect to decision_tree.html (must be before static middleware)
app.get('/', (req, res) => {
    res.redirect('/decision_tree.html');
});

app.use(express.static(__dirname)); // Serve static files from current directory

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFile('app.log', logMessage, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

// Endpoint to save tree data to a file
app.post('/api/save', (req, res) => {
    const { filename, treeData } = req.body;

    if (!filename || !treeData) {
        return res.status(400).json({ error: 'Filename and treeData are required' });
    }

    // Ensure filename ends with .js
    const safeFilename = filename.endsWith('.js') ? filename : `${filename}.js`;
    const filePath = path.join(__dirname, safeFilename);

    // Format the content as a JS file
    const fileContent = `window.treeData = ${JSON.stringify(treeData, null, 4)};`;

    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            log(`Error saving file ${safeFilename}: ${err.message}`);
            return res.status(500).json({ error: 'Failed to save file' });
        }
        log(`File saved: ${safeFilename}`);
        res.json({ success: true, message: `File saved as ${safeFilename}` });
    });
});

// Endpoint to list and search .js files
app.get('/api/search-files', (req, res) => {
    const searchQuery = req.query.q || '';
    const searchTerm = searchQuery.toLowerCase().trim();

    try {
        const files = fs.readdirSync(__dirname);
        const jsFiles = files.filter(file => file.endsWith('.js') && 
            !file.includes('.test.js') && 
            file !== 'server.js' && 
            file !== 'script.js');

        if (!searchTerm) {
            return res.json({ files: jsFiles });
        }

        // Read file contents and search
        const results = [];
        jsFiles.forEach(filename => {
            try {
                const filePath = path.join(__dirname, filename);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Extract text content (remove JS syntax, keep strings and comments)
                const textContent = content
                    .replace(/\/\*[\s\S]*?\*\//g, ' ') // Remove block comments
                    .replace(/\/\/.*/g, ' ') // Remove line comments
                    .replace(/['"]/g, ' ') // Remove quotes
                    .replace(/[{}[\]();,=]/g, ' ') // Remove JS syntax
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .toLowerCase();

                // Check if search term appears in filename or content
                const filenameMatch = filename.toLowerCase().includes(searchTerm);
                const contentMatch = textContent.includes(searchTerm);

                if (filenameMatch || contentMatch) {
                    // Extract matching snippets
                    const snippets = [];
                    const words = textContent.split(' ');
                    words.forEach((word, index) => {
                        if (word.includes(searchTerm)) {
                            const start = Math.max(0, index - 2);
                            const end = Math.min(words.length, index + 3);
                            snippets.push(words.slice(start, end).join(' '));
                        }
                    });

                    results.push({
                        filename: filename,
                        filenameMatch: filenameMatch,
                        contentMatch: contentMatch,
                        snippets: snippets.slice(0, 3) // Limit to 3 snippets
                    });
                }
            } catch (err) {
                console.error(`Error reading file ${filename}:`, err);
            }
        });

        res.json({ files: results });
    } catch (error) {
        console.error('Error searching files:', error);
        log(`Error searching files: ${error.message}`);
        res.status(500).json({ error: 'Failed to search files' });
    }
});

// Endpoint to proxy requests to Ollama
app.post('/api/generate', async (req, res) => {
    const { prompt, model = 'gemma3:4b' } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    log(`Generating content with model: ${model}`);

    try {
        // Forward request to Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false // Disable streaming for simpler handling
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error communicating with Ollama:', error);
        log(`Error communicating with Ollama: ${error.message}`);
        res.status(500).json({ error: 'Failed to communicate with Ollama', details: error.message });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        log(`Server running at http://localhost:${PORT}`);
        log(`Open http://localhost:${PORT}/decision_tree.html to view the app`);
    });
}

module.exports = app;
