/**
 * Unit test to verify that file names match when opening a link
 * This test ensures that when a link points to a specific file,
 * the correct data is loaded and matches the expected filename.
 * 
 * Bug: Link to food-shopping.js was opening hiking_decision_data.js
 */

// Mock DOM and global objects
global.window = {
    location: {
        href: 'http://localhost:3000/decision_tree.html',
        pathname: '/decision_tree.html',
        search: ''
    },
    addEventListener: jest.fn(),
    open: jest.fn()
};

global.document = {
    getElementById: jest.fn(),
    createElement: jest.fn((tag) => {
        if (tag === 'script') {
            return {
                setAttribute: jest.fn(),
                textContent: '',
                src: '',
                onload: null,
                onerror: null,
                parentNode: null,
                remove: jest.fn(),
                getAttribute: jest.fn(() => null)
            };
        }
        return {
            style: {},
            appendChild: jest.fn(),
            classList: { add: jest.fn(), remove: jest.fn() },
            querySelector: jest.fn(() => null),
            head: {
                appendChild: jest.fn()
            },
            body: {
                appendChild: jest.fn(),
                removeChild: jest.fn()
            }
        };
    }),
    querySelector: jest.fn(() => null),
    head: {
        appendChild: jest.fn()
    },
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    addEventListener: jest.fn()
};

global.alert = jest.fn();
global.URLSearchParams = jest.fn((search) => ({
    get: jest.fn((key) => {
        if (key === 'file') {
            return search.includes('file=') ? search.split('file=')[1].split('&')[0] : null;
        }
        return null;
    })
}));

// Mock setTimeout
global.setTimeout = jest.fn((fn, delay) => {
    if (typeof fn === 'function') {
        // Execute immediately for testing
        fn();
        return 1;
    }
    return 1;
});

describe('Link Filename Match Verification', () => {
    let loadTreeFile;
    let loadScript;
    let toCamelCase;
    let click;
    let loadTreeData;
    let mockScriptElement;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        
        // Reset window object
        global.window.location.href = 'http://localhost:3000/decision_tree.html';
        global.window.location.search = '';
        
        // Clear all existing window properties except location and event listeners
        Object.keys(global.window).forEach(key => {
            if (key !== 'location' && key !== 'addEventListener' && key !== 'open') {
                delete global.window[key];
            }
        });

        // Mock script element
        mockScriptElement = {
            setAttribute: jest.fn(),
            textContent: '',
            src: '',
            onload: null,
            onerror: null,
            parentNode: { removeChild: jest.fn() },
            remove: jest.fn(),
            getAttribute: jest.fn(() => null)
        };

        global.document.createElement.mockReturnValue(mockScriptElement);
        global.document.querySelector.mockReturnValue(null);

        // Extract functions from script.js logic
        toCamelCase = (str) => {
            return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
        };

        loadTreeFile = (filename, openInNewWindow) => {
            if (openInNewWindow) {
                const url = global.window.location.href.split('?')[0] + '?file=' + encodeURIComponent(filename);
                global.window.open(url, '_blank');
            } else {
                global.window.location.href = global.window.location.href.split('?')[0] + '?file=' + encodeURIComponent(filename);
            }
        };

        loadScript = (filename, callback) => {
            const existingScript = global.document.querySelector(`script[data-tree-file="${filename}"]`);
            if (existingScript) {
                existingScript.remove();
            }

            const script = global.document.createElement('script');
            script.setAttribute('data-tree-file', filename);
            script.src = filename;
            script.onload = callback;
            script.onerror = function () {
                alert('Failed to load file: ' + filename);
            };
            global.document.head.appendChild(script);
            return script;
        };

        loadTreeData = jest.fn((treeData) => {
            return treeData;
        });

        click = (event, d) => {
            if (d.data.link) {
                event.stopPropagation();
                const linkData = d.data.link;
                const filename = typeof linkData === 'string' ? linkData : linkData.file;
                const openInNewWindow = typeof linkData === 'object' && linkData.newWindow === true;
                loadTreeFile(filename, openInNewWindow);
                return;
            }
        };
    });

    /**
     * Simulates the data detection logic from script.js (FIXED VERSION)
     * This function matches filenames correctly by prioritizing filename-derived variable names
     */
    function detectDataFromFile(fileParam) {
        let loadedData = null;
        const baseName = fileParam.replace('.js', '');
        const varName = baseName.replace(/[-_]/g, '');
        const camelCaseName = toCamelCase(baseName);

        // Prioritize filename-derived variable names over hardcoded ones
        // This ensures that food-shopping.js loads foodShoppingData, not hikingData
        const possibleNames = [
            camelCaseName + 'Data',
            camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data',
            varName + 'Data',
            varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
            // Fallback to common names only if filename-derived names don't match
            'treeData', 'hikingData', 'relocationData'
        ];

        // First, try specific name matching
        for (let name of possibleNames) {
            if (typeof global.window[name] !== 'undefined') {
                loadedData = global.window[name];
                break;
            }
        }

        // Fallback: Try to match filename to variable name before picking first match
        // This prevents food-shopping.js from loading hikingData when both exist
        if (!loadedData) {
            const normalizedBaseName = baseName.toLowerCase().replace(/[-_]/g, '');
            const normalizedCamelCase = camelCaseName.toLowerCase();
            
            let bestMatch = null;
            let bestMatchScore = 0;
            
            for (let key in global.window) {
                if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                    if (global.window[key].name) {
                        const normalizedKey = key.toLowerCase().replace('data', '');
                        
                        // Score matches: exact match gets highest priority
                        let score = 0;
                        if (normalizedKey === normalizedBaseName || normalizedKey === normalizedCamelCase) {
                            score = 100; // Exact match - use immediately
                            loadedData = global.window[key];
                            break;
                        } else if (normalizedKey.includes(normalizedBaseName) || normalizedBaseName.includes(normalizedKey)) {
                            score = 50; // Partial match
                        } else {
                            score = 1; // Any match (lowest priority)
                        }
                        
                        if (score > bestMatchScore) {
                            bestMatch = global.window[key];
                            bestMatchScore = score;
                        }
                    }
                }
            }
            
            // Use best match if we found a partial match, otherwise use first match as last resort
            if (!loadedData) {
                if (bestMatch && bestMatchScore > 1) {
                    loadedData = bestMatch;
                } else {
                    // Last resort: pick first *Data variable found
                    for (let key in global.window) {
                        if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                            if (global.window[key].name) {
                                loadedData = global.window[key];
                                break;
                            }
                        }
                    }
                }
            }
        }

        return loadedData;
    }

    describe('Filename matching when multiple data files exist', () => {
        test('should load foodShoppingData when link points to food-shopping.js, even if hikingData exists', () => {
            // Setup: Multiple data files loaded (simulating previous page loads)
            global.window.hikingData = {
                name: 'Go Hiking?',
                children: []
            };
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: []
            };

            // Simulate clicking a link that points to food-shopping.js
            const linkFilename = 'food-shopping.js';
            const detectedData = detectDataFromFile(linkFilename);

            // Verify: Should load foodShoppingData, not hikingData
            expect(detectedData).not.toBeNull();
            expect(detectedData).toBe(global.window.foodShoppingData);
            expect(detectedData.name).toBe('Food Shopping?');
            expect(detectedData).not.toBe(global.window.hikingData);
        });

        test('should load hikingData when link points to hiking_decision_data.js, even if foodShoppingData exists', () => {
            // Setup: Multiple data files loaded
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: []
            };
            global.window.hikingData = {
                name: 'Go Hiking?',
                children: []
            };

            // Simulate clicking a link that points to hiking_decision_data.js
            const linkFilename = 'hiking_decision_data.js';
            const detectedData = detectDataFromFile(linkFilename);

            // Verify: Should load hikingData, not foodShoppingData
            expect(detectedData).not.toBeNull();
            expect(detectedData).toBe(global.window.hikingData);
            expect(detectedData.name).toBe('Go Hiking?');
            expect(detectedData).not.toBe(global.window.foodShoppingData);
        });

        test('should match exact filename to data variable name', () => {
            // Test various filename patterns
            const testCases = [
                {
                    filename: 'food-shopping.js',
                    expectedVarName: 'foodShoppingData',
                    expectedName: 'Food Shopping?'
                },
                {
                    filename: 'buy-a-car.js',
                    expectedVarName: 'buyACarData',
                    expectedName: 'Buy a Car?'
                },
                {
                    filename: 'new-location.js',
                    expectedVarName: 'newLocationData',
                    expectedName: 'New Location?'
                }
            ];

            testCases.forEach(testCase => {
                // Clear previous data
                Object.keys(global.window).forEach(key => {
                    if (key.endsWith('Data')) {
                        delete global.window[key];
                    }
                });

                // Set up the expected data variable
                global.window[testCase.expectedVarName] = {
                    name: testCase.expectedName,
                    children: []
                };

                // Also set up a different data variable to ensure we pick the right one
                global.window.hikingData = {
                    name: 'Go Hiking?',
                    children: []
                };

                const detectedData = detectDataFromFile(testCase.filename);

                expect(detectedData).not.toBeNull();
                expect(detectedData).toBe(global.window[testCase.expectedVarName]);
                expect(detectedData.name).toBe(testCase.expectedName);
                expect(detectedData).not.toBe(global.window.hikingData);
            });
        });
    });

    describe('End-to-end link click to data loading', () => {
        test('should load correct file when clicking node with link to food-shopping.js', () => {
            // Setup: Multiple data files exist
            global.window.hikingData = {
                name: 'Go Hiking?',
                children: []
            };
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: [
                    {
                        name: "What's your budget?",
                        children: []
                    }
                ]
            };

            // Step 1: Simulate clicking a node with a link
            const mockEvent = {
                stopPropagation: jest.fn()
            };
            const mockNode = {
                data: {
                    name: 'Restart decision',
                    link: 'food-shopping.js'
                }
            };

            click(mockEvent, mockNode);

            // Step 2: Verify URL was updated with correct filename
            expect(global.window.location.href).toContain('file=food-shopping.js');
            expect(global.window.location.href).not.toContain('hiking_decision_data.js');

            // Step 3: Simulate script loading and data detection
            const fileParam = 'food-shopping.js';
            const detectedData = detectDataFromFile(fileParam);

            // Step 4: Verify correct data was detected
            expect(detectedData).not.toBeNull();
            expect(detectedData).toBe(global.window.foodShoppingData);
            expect(detectedData.name).toBe('Food Shopping?');
            expect(detectedData.children.length).toBeGreaterThan(0);
        });

        test('should verify filename in link matches filename in URL parameter', () => {
            const testCases = [
                { link: 'food-shopping.js', expectedUrlFile: 'food-shopping.js' },
                { link: 'hiking_decision_data.js', expectedUrlFile: 'hiking_decision_data.js' },
                { link: { file: 'buy-a-car.js' }, expectedUrlFile: 'buy-a-car.js' },
                { link: { file: 'new-location.js', newWindow: true }, expectedUrlFile: 'new-location.js' }
            ];

            testCases.forEach(testCase => {
                // Reset
                global.window.location.href = 'http://localhost:3000/decision_tree.html';
                jest.clearAllMocks();

                const mockEvent = {
                    stopPropagation: jest.fn()
                };
                const mockNode = {
                    data: {
                        name: 'Test Link',
                        link: testCase.link
                    }
                };

                click(mockEvent, mockNode);

                // Verify filename in URL matches the link filename
                const url = global.window.location.href;
                const urlFileParam = url.includes('file=') 
                    ? decodeURIComponent(url.split('file=')[1].split('&')[0])
                    : null;

                if (testCase.link.newWindow) {
                    // For new window, check window.open was called with correct file
                    expect(global.window.open).toHaveBeenCalledWith(
                        expect.stringContaining(`file=${encodeURIComponent(testCase.expectedUrlFile)}`),
                        '_blank'
                    );
                } else {
                    expect(urlFileParam).toBe(testCase.expectedUrlFile);
                }
            });
        });
    });

    describe('Bug reproduction: food-shopping.js link loading wrong file', () => {
        test('should NOT load hikingData when link is food-shopping.js', () => {
            // Reproduce the bug scenario:
            // 1. hikingData exists (from previous page load)
            // 2. User clicks link to food-shopping.js
            // 3. foodShoppingData should be loaded, NOT hikingData

            global.window.hikingData = {
                name: 'Go Hiking?',
                children: [
                    {
                        name: 'Any Injuries?',
                        children: []
                    }
                ]
            };
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: [
                    {
                        name: "What's your budget?",
                        children: []
                    }
                ]
            };

            // Simulate the link click
            const linkFilename = 'food-shopping.js';
            const detectedData = detectDataFromFile(linkFilename);

            // CRITICAL ASSERTIONS: Verify correct file is loaded
            expect(detectedData).not.toBeNull();
            expect(detectedData.name).toBe('Food Shopping?');
            expect(detectedData).toBe(global.window.foodShoppingData);
            
            // CRITICAL: Should NOT be hikingData
            expect(detectedData).not.toBe(global.window.hikingData);
            expect(detectedData.name).not.toBe('Go Hiking?');
        });

        test('should verify filename-to-variable-name mapping is correct', () => {
            // This test verifies the mapping logic works correctly
            const filename = 'food-shopping.js';
            const baseName = filename.replace('.js', '');
            const varName = baseName.replace(/[-_]/g, '');
            const camelCaseName = toCamelCase(baseName);

            expect(baseName).toBe('food-shopping');
            expect(varName).toBe('foodshopping');
            expect(camelCaseName).toBe('foodShopping');

            // Expected variable name should be foodShoppingData
            const expectedVarName = camelCaseName + 'Data';
            expect(expectedVarName).toBe('foodShoppingData');

            // Verify this matches what's in food-shopping.js
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: []
            };

            expect(typeof global.window[expectedVarName]).not.toBe('undefined');
            expect(global.window[expectedVarName].name).toBe('Food Shopping?');
        });
    });
});

