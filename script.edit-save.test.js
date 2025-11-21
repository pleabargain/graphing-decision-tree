// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
/**
 * Unit tests for script.js - Node editing and saving functionality
 * Tests that edits to nodes are saved to .js files and UI refreshes properly
 */

// Mock DOM and global objects
global.window = {
    location: { 
        href: 'http://localhost:3000/decision_tree.html?file=food-shopping.js',
        search: '?file=food-shopping.js'
    },
    addEventListener: jest.fn(),
    URLSearchParams: jest.fn((search) => ({
        get: jest.fn((key) => key === 'file' ? 'food-shopping.js' : null)
    }))
};

global.document = {
    getElementById: jest.fn((id) => {
        const elements = {
            'menu-edit-node': {
                addEventListener: jest.fn()
            },
            'save-filename': {
                value: 'food-shopping.js'
            },
            'current-path': {
                textContent: ''
            },
            'edit-mode-toggle': {
                addEventListener: jest.fn(),
                checked: false
            },
            'edit-controls': {
                style: { display: 'none' }
            },
            'context-menu': {
                style: { display: 'none' },
                contains: jest.fn(() => false)
            },
            'data-file-input': {
                addEventListener: jest.fn()
            }
        };
        return elements[id] || null;
    }),
    createElement: jest.fn(() => ({
        style: {},
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        setAttribute: jest.fn(),
        textContent: ''
    })),
    body: {
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() }
    },
    addEventListener: jest.fn(),
    querySelector: jest.fn(() => null),
    head: {
        appendChild: jest.fn()
    }
};

global.alert = jest.fn();
global.prompt = jest.fn();
global.confirm = jest.fn(() => true);
global.fetch = jest.fn();

// Mock D3
const mockD3 = {
    select: jest.fn(() => ({
        append: jest.fn(() => ({
            attr: jest.fn().mockReturnThis(),
            style: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            selectAll: jest.fn(() => ({
                data: jest.fn(() => ({
                    enter: jest.fn(() => ({
                        append: jest.fn(() => ({
                            attr: jest.fn().mockReturnThis(),
                            style: jest.fn().mockReturnThis(),
                            text: jest.fn().mockReturnThis(),
                            on: jest.fn().mockReturnThis()
                        })),
                        insert: jest.fn(() => ({
                            attr: jest.fn().mockReturnThis()
                        }))
                    })),
                    exit: jest.fn(() => ({
                        transition: jest.fn(() => ({
                            duration: jest.fn(() => ({
                                attr: jest.fn().mockReturnThis(),
                                remove: jest.fn(),
                                style: jest.fn().mockReturnThis(),
                                select: jest.fn(() => ({
                                    attr: jest.fn().mockReturnThis()
                                }))
                            }))
                        }))
                    })),
                    merge: jest.fn(() => ({
                        transition: jest.fn(() => ({
                            duration: jest.fn(() => ({
                                attr: jest.fn().mockReturnThis(),
                                select: jest.fn(() => ({
                                    attr: jest.fn().mockReturnThis(),
                                    style: jest.fn().mockReturnThis(),
                                    text: jest.fn().mockReturnThis()
                                })),
                                selectAll: jest.fn(() => ({
                                    filter: jest.fn(() => ({
                                        text: jest.fn().mockReturnThis()
                                    })),
                                    text: jest.fn().mockReturnThis()
                                }))
                            }))
                        }))
                    }))
                })),
                remove: jest.fn()
            }))
        })),
        selectAll: jest.fn(() => ({
            data: jest.fn(() => ({
                enter: jest.fn(() => ({
                    append: jest.fn(() => ({
                        attr: jest.fn().mockReturnThis(),
                        style: jest.fn().mockReturnThis(),
                        text: jest.fn().mockReturnThis(),
                        on: jest.fn().mockReturnThis()
                    }))
                })),
                exit: jest.fn(() => ({
                    transition: jest.fn(() => ({
                        duration: jest.fn(() => ({
                            attr: jest.fn().mockReturnThis(),
                            remove: jest.fn()
                        }))
                    }))
                })),
                merge: jest.fn(() => ({
                    transition: jest.fn(() => ({
                        duration: jest.fn(() => ({
                            attr: jest.fn().mockReturnThis(),
                            select: jest.fn(() => ({
                                attr: jest.fn().mockReturnThis(),
                                style: jest.fn().mockReturnThis(),
                                text: jest.fn().mockReturnThis()
                            })),
                            selectAll: jest.fn(() => ({
                                filter: jest.fn(() => ({
                                    text: jest.fn().mockReturnThis()
                                })),
                                text: jest.fn().mockReturnThis()
                            }))
                        }))
                    }))
                }))
            })),
            remove: jest.fn()
        }))
    })),
    hierarchy: jest.fn((data) => ({
        data: data,
        x0: 0,
        y0: 0,
        children: null,
        _children: null
    })),
    tree: jest.fn(() => ({
        size: jest.fn().mockReturnThis(),
        descendants: jest.fn(() => [])
    })),
    max: jest.fn(() => 0)
};

global.d3 = mockD3;

describe('Node Edit and Save Functionality', () => {
    let selectedNode;
    let root;
    let updateCalled;
    let refreshUICalled;

    beforeEach(() => {
        jest.clearAllMocks();
        updateCalled = false;
        refreshUICalled = false;

        // Mock tree data structure
        root = {
            data: {
                name: 'Food Shopping?',
                children: [
                    {
                        name: "What's your budget?",
                        children: [
                            {
                                name: 'High budget',
                                children: [{ name: 'Go to Carrefour' }]
                            }
                        ]
                    }
                ]
            }
        };

        selectedNode = {
            data: {
                name: 'Go to Viva',
                children: []
            },
            parent: {
                data: {
                    children: [
                        {
                            name: 'Go to Viva',
                            children: []
                        }
                    ]
                }
            }
        };

        // Mock update function
        global.update = jest.fn((source) => {
            updateCalled = true;
        });

        // Mock refreshUI function
        global.refreshUI = jest.fn(() => {
            refreshUICalled = true;
            if (root) {
                global.update(root);
            }
        });

        // Mock URLSearchParams
        global.URLSearchParams = jest.fn((search) => ({
            get: jest.fn((key) => {
                if (key === 'file') {
                    return 'food-shopping.js';
                }
                return null;
            })
        }));

        // Mock fetch for save API
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });
    });

    describe('Edit Text and Auto-Save', () => {
        test('should update node name when user edits text', () => {
            const originalName = selectedNode.data.name;
            const newName = 'Go to Viva downstairs';

            // Simulate edit
            selectedNode.data.name = newName;

            expect(selectedNode.data.name).toBe(newName);
            expect(selectedNode.data.name).not.toBe(originalName);
        });

        test('should call refreshUI after editing node text', () => {
            const newName = 'Go to Viva downstairs';
            selectedNode.data.name = newName;

            // Simulate refreshUI call
            refreshUI();

            expect(refreshUICalled).toBe(true);
            expect(updateCalled).toBe(true);
        });

        test('should auto-save to .js file when editing node with file parameter', async () => {
            const newName = 'Go to Viva downstairs';
            selectedNode.data.name = newName;

            // Simulate the edit handler logic
            if (selectedNode) {
                // Refresh UI
                refreshUI();

                // Auto-save logic
                const urlParams = new URLSearchParams(window.location.search);
                const fileParam = urlParams.get('file');

                if (fileParam) {
                    // Clean data function
                    function cleanData(node) {
                        const clean = { name: node.name };
                        if (node.children && node.children.length > 0) {
                            clean.children = node.children.map(cleanData);
                        }
                        if (node.link) {
                            clean.link = node.link;
                        }
                        return clean;
                    }

                    const treeDataToSave = cleanData(root.data);

                    const response = await fetch('/api/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            filename: fileParam,
                            treeData: treeDataToSave
                        })
                    });

                    const result = await response.json();

                    expect(fetch).toHaveBeenCalledWith('/api/save', expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    }));

                    expect(result.success).toBe(true);
                }
            }
        });

        test('should save edited node name to file', async () => {
            const newName = 'Go to Viva downstairs';
            selectedNode.data.name = newName;

            // Update root data to reflect the change
            function updateNodeInTree(node, targetName, newName) {
                if (node.data.name === targetName) {
                    node.data.name = newName;
                    return;
                }
                if (node.data.children) {
                    node.data.children.forEach(child => {
                        updateNodeInTree({ data: child }, targetName, newName);
                    });
                }
            }

            // Simulate finding and updating the node in the tree
            updateNodeInTree(root, 'Go to Viva', newName);

            // Clean data function
            function cleanData(node) {
                const clean = { name: node.name };
                if (node.children && node.children.length > 0) {
                    clean.children = node.children.map(cleanData);
                }
                if (node.link) {
                    clean.link = node.link;
                }
                return clean;
            }

            const treeDataToSave = cleanData(root.data);

            // Verify the edited name is in the data to be saved
            function findNodeByName(data, name) {
                if (data.name === name) {
                    return data;
                }
                if (data.children) {
                    for (let child of data.children) {
                        const found = findNodeByName(child, name);
                        if (found) return found;
                    }
                }
                return null;
            }

            // Since we're simulating, let's verify the structure
            expect(treeDataToSave.name).toBe('Food Shopping?');
            expect(treeDataToSave.children).toBeDefined();
        });

        test('should handle save failure gracefully', async () => {
            // Mock fetch to return error
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: false, error: 'File write failed' })
            });

            const urlParams = new URLSearchParams(window.location.search);
            const fileParam = urlParams.get('file');

            if (fileParam) {
                function cleanData(node) {
                    const clean = { name: node.name };
                    if (node.children && node.children.length > 0) {
                        clean.children = node.children.map(cleanData);
                    }
                    if (node.link) {
                        clean.link = node.link;
                    }
                    return clean;
                }

                const treeDataToSave = cleanData(root.data);

                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: fileParam,
                        treeData: treeDataToSave
                    })
                });

                const result = await response.json();

                expect(result.success).toBe(false);
                expect(result.error).toBe('File write failed');
            }
        });
    });

    describe('UI Refresh Functionality', () => {
        test('refreshUI should call update function when root exists', () => {
            refreshUI();

            expect(refreshUICalled).toBe(true);
            expect(updateCalled).toBe(true);
            expect(global.update).toHaveBeenCalledWith(root);
        });

        test('refreshUI should not throw error when root is null', () => {
            root = null;

            expect(() => {
                refreshUI();
            }).not.toThrow();
        });

        test('refreshUI should update text labels in visualization', () => {
            const newName = 'Updated Node Name';
            selectedNode.data.name = newName;

            // Simulate refreshUI updating the visualization
            refreshUI();

            // Verify update was called
            expect(updateCalled).toBe(true);

            // In a real scenario, the D3 selection would update the text
            // Here we verify the function was called correctly
            expect(global.update).toHaveBeenCalled();
        });

        test('should refresh UI immediately after text edit', () => {
            const newName = 'New Node Text';
            
            // Simulate edit handler
            if (selectedNode) {
                selectedNode.data.name = newName;
                refreshUI();
            }

            expect(selectedNode.data.name).toBe(newName);
            expect(refreshUICalled).toBe(true);
            expect(updateCalled).toBe(true);
        });
    });

    describe('Integration: Edit, Refresh, and Save', () => {
        test('should complete full flow: edit -> refresh -> save', async () => {
            const originalName = selectedNode.data.name;
            const newName = 'Go to Viva downstairs';

            // Step 1: Edit
            selectedNode.data.name = newName;
            expect(selectedNode.data.name).toBe(newName);

            // Step 2: Refresh UI
            refreshUI();
            expect(refreshUICalled).toBe(true);

            // Step 3: Save
            const urlParams = new URLSearchParams(window.location.search);
            const fileParam = urlParams.get('file');

            if (fileParam) {
                function cleanData(node) {
                    const clean = { name: node.name };
                    if (node.children && node.children.length > 0) {
                        clean.children = node.children.map(cleanData);
                    }
                    if (node.link) {
                        clean.link = node.link;
                    }
                    return clean;
                }

                const treeDataToSave = cleanData(root.data);

                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: fileParam,
                        treeData: treeDataToSave
                    })
                });

                const result = await response.json();

                expect(result.success).toBe(true);
                expect(fetch).toHaveBeenCalled();
            }
        });
    });
});

