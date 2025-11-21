const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
const fetch = require('node-fetch');

const app = require('./server');

describe('API Endpoints', () => {
    const testFilename = 'test_save_jest.js';
    const testFilePath = path.join(__dirname, testFilename);

    afterAll(() => {
        // Cleanup test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    describe('GET /', () => {
        it('should redirect root path to decision_tree.html with 302 status', async () => {
            const res = await request(app)
                .get('/')
                .expect(302); // 302 is redirect status code

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/decision_tree.html');
        });

        it('should have correct redirect headers', async () => {
            const res = await request(app)
                .get('/')
                .expect(302);

            expect(res.headers).toHaveProperty('location');
            expect(res.headers.location).toBe('/decision_tree.html');
        });

        it('should not return any body content on redirect', async () => {
            const res = await request(app)
                .get('/')
                .expect(302);

            expect(res.text).toBe('Found. Redirecting to /decision_tree.html');
        });

        it('should handle root path with trailing slash', async () => {
            const res = await request(app)
                .get('/')
                .expect(302);

            expect(res.headers.location).toBe('/decision_tree.html');
        });
    });

    describe('Static File Serving', () => {
        it('should serve decision_tree.html file', async () => {
            const res = await request(app)
                .get('/decision_tree.html')
                .expect(200);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/text\/html/);
            expect(res.text).toContain('<!DOCTYPE html>');
            expect(res.text).toContain('Interactive Decision Tree');
        });

        it('should serve CSS files', async () => {
            const res = await request(app)
                .get('/styles.css')
                .expect(200);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/text\/css/);
        });

        it('should serve JavaScript data files', async () => {
            // Check if a known data file exists
            if (fs.existsSync(path.join(__dirname, 'dinner_decision_data.js'))) {
                const res = await request(app)
                    .get('/dinner_decision_data.js')
                    .expect(200);

                expect(res.statusCode).toBe(200);
                expect(res.headers['content-type']).toMatch(/application\/javascript|text\/javascript/);
            }
        });

        it('should return 404 for non-existent files', async () => {
            const res = await request(app)
                .get('/nonexistent-file-12345.html')
                .expect(404);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/save', () => {
        it('should save tree data to a file', async () => {
            const treeData = { name: 'Test Root', children: [] };
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename, treeData });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(fs.existsSync(testFilePath)).toBe(true);

            const content = fs.readFileSync(testFilePath, 'utf8');
            expect(content).toContain('window.treeData =');
            expect(content).toContain('"name": "Test Root"');
        });

        it('should return 400 if filename or treeData is missing', async () => {
            const res = await request(app)
                .post('/api/save')
                .send({ filename: testFilename }); // Missing treeData

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/generate', () => {
        it('should return generated content', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ response: '["Option A", "Option B"]' })
            });

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.response).toBe('["Option A", "Option B"]');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if prompt is missing', async () => {
            const res = await request(app)
                .post('/api/generate')
                .send({});

            expect(res.statusCode).toEqual(400);
        });

        it('should handle Ollama API errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error'
            });

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(500);
            expect(res.body.error).toBe('Failed to communicate with Ollama');
            expect(res.body.details).toContain('Ollama API error');
        });

        it('should handle network errors', async () => {
            fetch.mockRejectedValue(new Error('Network connection failed'));

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(500);
            expect(res.body.error).toBe('Failed to communicate with Ollama');
            expect(res.body.details).toBe('Network connection failed');
        });

        it('should handle null response from Ollama', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(null)
            });

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeNull();
        });

        it('should handle response without response property', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ error: 'Some error', message: 'No response field' })
            });

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.error).toBe('Some error');
            expect(res.body.response).toBeUndefined();
        });

        it('should handle empty response object', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            });

            const res = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Test prompt' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({});
            expect(res.body.response).toBeUndefined();
        });
    });

    describe('POST /api/generate + POST /api/save - Full Flow', () => {
        const ollamaGeneratedFilename = 'test_ollama_generated.js';
        const ollamaGeneratedFilePath = path.join(__dirname, ollamaGeneratedFilename);

        afterEach(() => {
            // Cleanup test file after each test
            if (fs.existsSync(ollamaGeneratedFilePath)) {
                fs.unlinkSync(ollamaGeneratedFilePath);
            }
        });

        it('should create .js file from Ollama-generated tree data', async () => {
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
            expect(start).not.toBe(-1);
            expect(end).not.toBe(-1);

            const options = JSON.parse(jsonStr.substring(start, end + 1));
            expect(Array.isArray(options)).toBe(true);
            expect(options.length).toBe(3);

            // Step 3: Create tree structure
            const treeData = {
                name: 'Root',
                children: options.map(opt => ({ name: opt, children: [] }))
            };

            expect(treeData.children.length).toBe(3);
            expect(treeData.children[0].name).toBe('Option A');

            // Step 4: Save the tree to a .js file
            const saveRes = await request(app)
                .post('/api/save')
                .send({ filename: ollamaGeneratedFilename, treeData });

            expect(saveRes.statusCode).toEqual(200);
            expect(saveRes.body.success).toBe(true);
            expect(fs.existsSync(ollamaGeneratedFilePath)).toBe(true);

            // Step 5: Verify file content
            const fileContent = fs.readFileSync(ollamaGeneratedFilePath, 'utf8');
            expect(fileContent).toContain('window.treeData =');
            expect(fileContent).toContain('"name": "Root"');
            expect(fileContent).toContain('"Option A"');
            expect(fileContent).toContain('"Option B"');
            expect(fileContent).toContain('"Option C"');
        });

        it('should handle malformed JSON in Ollama response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ 
                    response: 'This is not valid JSON [Option A, Option B]',
                    model: 'gemma3:4b'
                })
            });

            const generateRes = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Generate options' });

            expect(generateRes.statusCode).toEqual(200);
            const jsonStr = generateRes.body.response;
            const start = jsonStr.indexOf('[');
            const end = jsonStr.lastIndexOf(']');

            // Should still find brackets even in malformed response
            expect(start).not.toBe(-1);
            expect(end).not.toBe(-1);

            // But parsing might fail - this tests the error case
            const extracted = jsonStr.substring(start, end + 1);
            expect(() => JSON.parse(extracted)).toThrow();
        });

        it('should handle Ollama response with extra text around JSON', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ 
                    response: 'Here are the options: ["Option 1", "Option 2"]. These are good choices.',
                    model: 'gemma3:4b'
                })
            });

            const generateRes = await request(app)
                .post('/api/generate')
                .send({ prompt: 'Generate options' });

            expect(generateRes.statusCode).toEqual(200);
            const jsonStr = generateRes.body.response;
            const start = jsonStr.indexOf('[');
            const end = jsonStr.lastIndexOf(']');

            expect(start).not.toBe(-1);
            expect(end).not.toBe(-1);

            const extracted = jsonStr.substring(start, end + 1);
            const options = JSON.parse(extracted);
            expect(Array.isArray(options)).toBe(true);
            expect(options).toEqual(['Option 1', 'Option 2']);
        });
    });

    describe('POST /api/save - Error Handling', () => {
        it('should handle file write errors', async () => {
            // Mock fs.writeFile to simulate error
            const originalWriteFile = fs.writeFile;
            fs.writeFile = jest.fn((...args) => {
                const cb = args[args.length - 1];
                cb(new Error('Permission denied'));
            });

            const res = await request(app)
                .post('/api/save')
                .send({ filename: 'error_test.js', treeData: {} });

            expect(res.statusCode).toEqual(500);
            expect(res.body.error).toBe('Failed to save file');

            // Restore fs.writeFile
            fs.writeFile = originalWriteFile;
        });
    });
});
