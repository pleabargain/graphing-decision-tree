// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
/**
 * Unit tests for server.js - File persistence verification
 * Tests that files are actually written to disk and persist after save operations
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
const fetch = require('node-fetch');

const app = require('./server');

describe('File Persistence Verification', () => {
    const testFilename = 'test_ollama_generated.js';
    const testFilePath = path.join(__dirname, testFilename);

    beforeEach(() => {
        // Clean up any existing test file before each test
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Final cleanup - remove test file if it still exists
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    describe('POST /api/save - File Persistence', () => {
        it('should write test_ollama_generated.js to disk and verify it exists', async () => {
            const treeData = {
                name: 'Test Root',
                children: [
                    { name: 'Child 1', children: [] },
                    { name: 'Child 2', children: [] }
                ]
            };

            // Verify file does not exist before save
            expect(fs.existsSync(testFilePath)).toBe(false);

            // Save the file
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain(testFilename);

            // Verify file exists after save
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Verify file content is correct
            const content = fs.readFileSync(testFilePath, 'utf8');
            expect(content).toContain('window.treeData =');
            expect(content).toContain('"name": "Test Root"');
            expect(content).toContain('"Child 1"');
            expect(content).toContain('"Child 2"');
        });

        it('should persist test_ollama_generated.js file after save operation completes', async () => {
            const treeData = {
                name: 'Persistent Test',
                children: []
            };

            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);

            // Wait a bit to ensure async operations complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file still exists after operation completes
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Verify file can be read
            const stats = fs.statSync(testFilePath);
            expect(stats.isFile()).toBe(true);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should write file with correct format matching existing decision tree files', async () => {
            const treeData = {
                name: 'Format Test',
                children: [
                    { name: 'Option A', children: [] },
                    { name: 'Option B', children: [] }
                ]
            };

            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Read and verify file format
            const content = fs.readFileSync(testFilePath, 'utf8');
            
            // Should start with window.treeData assignment
            expect(content.trim().startsWith('window.treeData =')).toBe(true);
            
            // Should contain valid JSON structure
            expect(content).toContain('"name": "Format Test"');
            expect(content).toContain('"children"');
            
            // Should be valid JavaScript (can be evaluated)
            expect(() => {
                // Remove the window.treeData = part and parse as JSON
                const jsonPart = content.replace('window.treeData =', '').replace(/;?\s*$/, '');
                JSON.parse(jsonPart);
            }).not.toThrow();
        });

        it('should handle filename without .js extension and add it', async () => {
            const treeData = { name: 'Test', children: [] };
            
            const res = await request(app)
                .post('/api/save')
                .send({ filename: 'test_ollama_generated', treeData });

            expect(res.statusCode).toEqual(200);
            expect(fs.existsSync(testFilePath)).toBe(true);
        });
    });

    describe('POST /api/generate + POST /api/save - Full Flow Persistence', () => {
        it('should create and persist test_ollama_generated.js from Ollama-generated content', async () => {
            // Mock successful Ollama response
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ 
                    response: '["Option A", "Option B", "Option C"]',
                    model: 'gemma3:4b'
                })
            });

            // Step 1: Generate content via Ollama
            const generateRes = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Generate 3 options for a decision tree' });

            expect(generateRes.statusCode).toEqual(200);
            expect(generateRes.body.response).toBe('["Option A", "Option B", "Option C"]');

            // Step 2: Parse the response and create tree data
            const jsonStr = generateRes.body.response;
            const start = jsonStr.indexOf('[');
            const end = jsonStr.lastIndexOf(']');
            const options = JSON.parse(jsonStr.substring(start, end + 1));

            // Step 3: Create tree structure
            const treeData = {
                name: 'Ollama Generated Root',
                children: options.map(opt => ({ name: opt, children: [] }))
            };

            // Step 4: Save the tree to test_ollama_generated.js
            const saveRes = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(saveRes.statusCode).toEqual(200);
            expect(saveRes.body.success).toBe(true);

            // Step 5: Verify file exists and persists
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Wait to ensure file is fully written
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file still exists after delay
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Step 6: Verify file content
            const fileContent = fs.readFileSync(testFilePath, 'utf8');
            expect(fileContent).toContain('window.treeData =');
            expect(fileContent).toContain('"name": "Ollama Generated Root"');
            expect(fileContent).toContain('"Option A"');
            expect(fileContent).toContain('"Option B"');
            expect(fileContent).toContain('"Option C"');

            // Step 7: Verify file can be read multiple times (persistence check)
            const fileContent2 = fs.readFileSync(testFilePath, 'utf8');
            expect(fileContent2).toBe(fileContent);
        });

        it('should verify test_ollama_generated.js file is written to correct directory', async () => {
            const treeData = { name: 'Directory Test', children: [] };

            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Verify file is in the expected directory (same as server.js)
            const expectedDir = __dirname;
            const actualDir = path.dirname(testFilePath);
            expect(actualDir).toBe(expectedDir);

            // Verify absolute path resolves correctly
            const absolutePath = path.resolve(testFilePath);
            expect(fs.existsSync(absolutePath)).toBe(true);
        });

        it('should verify file permissions allow reading after write', async () => {
            const treeData = { name: 'Permissions Test', children: [] };

            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Verify file is readable
            expect(() => {
                fs.accessSync(testFilePath, fs.constants.R_OK);
            }).not.toThrow();

            // Verify file stats
            const stats = fs.statSync(testFilePath);
            expect(stats.isFile()).toBe(true);
            expect(stats.size).toBeGreaterThan(0);
        });
    });

    describe('File Existence Verification', () => {
        it('should verify test_ollama_generated.js does not exist before test', () => {
            // This test ensures cleanup worked
            expect(fs.existsSync(testFilePath)).toBe(false);
        });

        it('should create test_ollama_generated.js and verify it exists in filesystem', async () => {
            const treeData = {
                name: 'Existence Test',
                children: []
            };

            // Verify it doesn't exist
            expect(fs.existsSync(testFilePath)).toBe(false);

            // Create it
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);

            // Verify it exists
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Verify it's actually a file (not a directory)
            const stats = fs.statSync(testFilePath);
            expect(stats.isFile()).toBe(true);
            expect(stats.isDirectory()).toBe(false);
        });

        it('should verify test_ollama_generated.js file is written and can be read back immediately', async () => {
            const treeData = {
                name: 'Read Back Test',
                children: [
                    { name: 'Child A', children: [] },
                    { name: 'Child B', children: [] }
                ]
            };

            // Save the file
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Immediately verify file exists
            expect(fs.existsSync(testFilePath)).toBe(true);

            // Read the file back and verify content
            const fileContent = fs.readFileSync(testFilePath, 'utf8');
            expect(fileContent).toBeTruthy();
            expect(fileContent.length).toBeGreaterThan(0);
            expect(fileContent).toContain('window.treeData =');
            expect(fileContent).toContain('"name": "Read Back Test"');
            expect(fileContent).toContain('"Child A"');
            expect(fileContent).toContain('"Child B"');

            // Verify file can be read multiple times (persistence)
            const fileContent2 = fs.readFileSync(testFilePath, 'utf8');
            expect(fileContent2).toBe(fileContent);
        });

        it('should verify test_ollama_generated.js persists across multiple read operations', async () => {
            const treeData = {
                name: 'Persistence Test',
                children: []
            };

            // Save the file
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);

            // Read file multiple times to verify it persists
            const read1 = fs.readFileSync(testFilePath, 'utf8');
            await new Promise(resolve => setTimeout(resolve, 50));
            const read2 = fs.readFileSync(testFilePath, 'utf8');
            await new Promise(resolve => setTimeout(resolve, 50));
            const read3 = fs.readFileSync(testFilePath, 'utf8');

            // All reads should return the same content
            expect(read1).toBe(read2);
            expect(read2).toBe(read3);
            expect(read1).toContain('"name": "Persistence Test"');
        });
    });
});

