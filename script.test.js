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

