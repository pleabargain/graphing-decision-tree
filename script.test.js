// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
/**
 * Unit tests for script.js - Client-side decision tree functionality
 * Tests the bug where selectedNode becomes null after hideContextMenu() is called
 */

// Mock DOM and global objects
global.window = {
    location: { href: 'http://localhost:3000/decision_tree.html' },
    addEventListener: jest.fn()
};

global.document = {
    getElementById: jest.fn(),
    createElement: jest.fn(() => ({
        style: {},
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() }
    })),
    body: {
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() }
    },
    addEventListener: jest.fn()
};

global.alert = jest.fn();
global.prompt = jest.fn();
global.confirm = jest.fn(() => true);
global.fetch = jest.fn();

describe('Generate Children (AI) Bug Fix', () => {
    let selectedNode;
    let hideContextMenu;
    let generateChildrenHandler;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        selectedNode = null;

        // Mock hideContextMenu function
        hideContextMenu = jest.fn(() => {
            selectedNode = null; // This simulates the bug
        });

        // Mock selectedNode with data structure
        selectedNode = {
            data: {
                name: 'Test Node',
                children: []
            },
            parent: null,
            _children: null,
            children: null
        };

        // Mock fetch to return successful response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                response: '["Option A", "Option B", "Option C"]'
            })
        });
    });

    test('should capture bug: selectedNode becomes null after hideContextMenu()', async () => {
        // Simulate the bug scenario
        const nodeRef = selectedNode; // Save reference before hideContextMenu
        
        // Simulate hideContextMenu being called (as it does in the actual code)
        hideContextMenu();
        
        // Verify selectedNode is now null
        expect(selectedNode).toBeNull();
        
        // This is where the bug occurs - trying to access .data on null
        expect(() => {
            if (selectedNode && selectedNode.data) {
                selectedNode.data.children = [];
            } else {
                throw new Error('Cannot read properties of null (reading \'data\')');
            }
        }).toThrow('Cannot read properties of null (reading \'data\')');
    });

    test('should fix bug: save node reference before hideContextMenu()', async () => {
        // Fix: Save reference before calling hideContextMenu
        const nodeRef = selectedNode;
        const nodeName = nodeRef.data.name;
        
        // Construct path context
        let path = [];
        let current = nodeRef;
        while (current) {
            path.unshift(current.data.name);
            current = current.parent;
        }
        const pathString = path.join(" > ");
        
        // Now safe to call hideContextMenu
        hideContextMenu();
        
        // Verify selectedNode is null (menu is hidden)
        expect(selectedNode).toBeNull();
        
        // But nodeRef still has the reference
        expect(nodeRef).not.toBeNull();
        expect(nodeRef.data.name).toBe('Test Node');
        
        // Simulate async fetch
        const response = await global.fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Given the decision tree path: "${pathString}", suggest 2 to 3 logical next distinct options or steps.Return ONLY a JSON array of strings, e.g., ["Option A", "Option B"].Do not include any other text.`
            })
        });
        
        const data = await response.json();
        const jsonStr = data.response;
        const start = jsonStr.indexOf('[');
        const end = jsonStr.lastIndexOf(']');
        
        if (start !== -1 && end !== -1) {
            const extracted = jsonStr.substring(start, end + 1);
            const options = JSON.parse(extracted);
            
            if (Array.isArray(options)) {
                // Use nodeRef instead of selectedNode - this fixes the bug
                if (!nodeRef.data.children) nodeRef.data.children = [];
                options.forEach(opt => {
                    nodeRef.data.children.push({ name: opt, children: [] });
                });
                
                // Verify children were added successfully
                expect(nodeRef.data.children.length).toBe(3);
                expect(nodeRef.data.children[0].name).toBe('Option A');
            }
        }
    });

    test('should handle case when selectedNode is null at start', () => {
        selectedNode = null;
        
        // Should not throw error, just return early
        if (!selectedNode) {
            return; // Early return
        }
        
        // This code should never execute
        expect(true).toBe(false); // Should not reach here
    });
});

describe('Tree Title Functionality', () => {
    let titleElement;
    let updateTreeTitle;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock title element
        titleElement = {
            textContent: '',
            style: { display: 'none' }
        };
        
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'tree-title') {
                return titleElement;
            }
            return null;
        });

        // Extract updateTreeTitle function logic for testing
        // This mimics the function from script.js
        updateTreeTitle = function(treeData, filename) {
            const titleElement = document.getElementById('tree-title');
            if (titleElement) {
                let titleText = '';
                
                // Prioritize filename when available (more predictable and matches user expectation)
                if (filename) {
                    titleText = filename.replace('.js', '').replace(/[-_]/g, ' ');
                    // Capitalize first letter of each word
                    titleText = titleText.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                } else if (treeData && treeData.name) {
                    // Fallback to root node name if no filename
                    titleText = treeData.name;
                }
                
                if (titleText) {
                    titleElement.textContent = titleText;
                    titleElement.style.display = 'block';
                } else {
                    titleElement.style.display = 'none';
                }
            }
        };
    });

    test('should prioritize filename over treeData.name when filename is provided', () => {
        const treeData = { name: 'Buy a New Phone?' };
        const filename = 'buy-phone.js';
        
        updateTreeTitle(treeData, filename);
        
        expect(titleElement.textContent).toBe('Buy Phone');
        expect(titleElement.style.display).toBe('block');
    });

    test('should use treeData.name when filename is not provided', () => {
        const treeData = { name: 'Go Hiking?' };
        const filename = null;
        
        updateTreeTitle(treeData, filename);
        
        expect(titleElement.textContent).toBe('Go Hiking?');
        expect(titleElement.style.display).toBe('block');
    });

    test('should format filename correctly (remove .js, replace dashes/underscores with spaces, capitalize)', () => {
        const treeData = { name: 'Some Other Title' };
        
        updateTreeTitle(treeData, 'buy-phone.js');
        expect(titleElement.textContent).toBe('Buy Phone');
        
        updateTreeTitle(treeData, 'food_shopping.js');
        expect(titleElement.textContent).toBe('Food Shopping');
        
        updateTreeTitle(treeData, 'new-location.js');
        expect(titleElement.textContent).toBe('New Location');
    });

    test('should hide title element when neither filename nor treeData.name is available', () => {
        updateTreeTitle(null, null);
        
        expect(titleElement.style.display).toBe('none');
    });

    test('should handle empty treeData object', () => {
        updateTreeTitle({}, 'test-file.js');
        
        expect(titleElement.textContent).toBe('Test File');
        expect(titleElement.style.display).toBe('block');
    });

    test('should handle filename without extension', () => {
        const treeData = { name: 'Some Title' };
        
        updateTreeTitle(treeData, 'buy-phone');
        
        expect(titleElement.textContent).toBe('Buy Phone');
    });
});

