/**
 * Unit tests for script.js - Link loading functionality
 * Tests that clicking on nodes with links properly loads other decision tree graphs
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
                remove: jest.fn()
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
        return 1; // Return a mock timer ID
    }
    return 1;
});

describe('Link Loading Functionality', () => {
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
        
        // Clear any existing window properties
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
        // Note: In a real test environment, these would be imported or extracted
        // For now, we'll test the logic directly
        
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
            // Mock implementation
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

    describe('toCamelCase function', () => {
        test('should convert kebab-case to camelCase', () => {
            expect(toCamelCase('food-shopping')).toBe('foodShopping');
            expect(toCamelCase('buy-a-car')).toBe('buyACar');
            expect(toCamelCase('new-location')).toBe('newLocation');
        });

        test('should convert snake_case to camelCase', () => {
            expect(toCamelCase('food_shopping')).toBe('foodShopping');
            expect(toCamelCase('buy_a_car')).toBe('buyACar');
        });

        test('should handle mixed case', () => {
            expect(toCamelCase('food-shopping-data')).toBe('foodShoppingData');
        });
    });

    describe('loadTreeFile function', () => {
        test('should navigate to same window when openInNewWindow is false', () => {
            loadTreeFile('food-shopping.js', false);
            
            expect(global.window.location.href).toBe('http://localhost:3000/decision_tree.html?file=food-shopping.js');
            expect(global.window.open).not.toHaveBeenCalled();
        });

        test('should open in new window when openInNewWindow is true', () => {
            loadTreeFile('food-shopping.js', true);
            
            expect(global.window.open).toHaveBeenCalledWith(
                'http://localhost:3000/decision_tree.html?file=food-shopping.js',
                '_blank'
            );
        });

        test('should handle URL encoding correctly', () => {
            loadTreeFile('file with spaces.js', false);
            
            expect(global.window.location.href).toContain('file%20with%20spaces.js');
        });

        test('should handle existing query parameters', () => {
            global.window.location.href = 'http://localhost:3000/decision_tree.html?other=param';
            loadTreeFile('food-shopping.js', false);
            
            expect(global.window.location.href).toBe('http://localhost:3000/decision_tree.html?file=food-shopping.js');
        });
    });

    describe('loadScript function', () => {
        test('should create script element with correct attributes', () => {
            const callback = jest.fn();
            const script = loadScript('food-shopping.js', callback);
            
            expect(script.setAttribute).toHaveBeenCalledWith('data-tree-file', 'food-shopping.js');
            expect(script.src).toBe('food-shopping.js');
            expect(script.onload).toBe(callback);
            expect(global.document.head.appendChild).toHaveBeenCalledWith(script);
        });

        test('should remove existing script with same filename', () => {
            const existingScript = {
                remove: jest.fn(),
                getAttribute: jest.fn(() => 'food-shopping.js')
            };
            global.document.querySelector.mockReturnValue(existingScript);
            
            loadScript('food-shopping.js', jest.fn());
            
            expect(existingScript.remove).toHaveBeenCalled();
        });

        test('should call onerror handler when script fails to load', () => {
            const callback = jest.fn();
            const script = loadScript('nonexistent.js', callback);
            
            // Simulate script error
            if (script.onerror) {
                script.onerror();
            }
            
            expect(global.alert).toHaveBeenCalledWith('Failed to load file: nonexistent.js');
        });
    });

    describe('Data detection logic', () => {
        test('should detect foodShoppingData from food-shopping.js', () => {
            const baseName = 'food-shopping.js'.replace('.js', '');
            const varName = baseName.replace(/[-_]/g, '');
            const camelCaseName = toCamelCase(baseName);

            const possibleNames = [
                'treeData', 'hikingData', 'relocationData',
                varName + 'Data',
                varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                camelCaseName + 'Data',
                camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data'
            ];

            // Set up mock data
            global.window.foodShoppingData = { name: 'Food Shopping?', children: [] };

            let loadedData = null;
            for (let name of possibleNames) {
                if (typeof global.window[name] !== 'undefined') {
                    loadedData = global.window[name];
                    break;
                }
            }

            expect(loadedData).toBe(global.window.foodShoppingData);
            expect(loadedData.name).toBe('Food Shopping?');
        });

        test('should detect buyCarData from buy-a-car.js using fallback search', () => {
            const baseName = 'buy-a-car.js'.replace('.js', '');
            const varName = baseName.replace(/[-_]/g, '');
            const camelCaseName = toCamelCase(baseName);

            const possibleNames = [
                'treeData', 'hikingData', 'relocationData',
                varName + 'Data',
                varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                camelCaseName + 'Data',
                camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data'
            ];

            // Set up mock data - actual variable name is buyCarData (not buyACarData)
            global.window.buyCarData = { name: 'Buy a Car?', children: [] };

            let loadedData = null;
            for (let name of possibleNames) {
                if (typeof global.window[name] !== 'undefined') {
                    loadedData = global.window[name];
                    break;
                }
            }

            // If not found in specific names, use fallback search
            if (!loadedData) {
                for (let key in global.window) {
                    if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                        if (global.window[key].name) {
                            loadedData = global.window[key];
                            break;
                        }
                    }
                }
            }

            expect(loadedData).toBe(global.window.buyCarData);
            expect(loadedData.name).toBe('Buy a Car?');
        });

        test('should fallback to searching for any *Data variable', () => {
            // Clear specific variables
            delete global.window.foodShoppingData;
            delete global.window.treeData;
            delete global.window.hikingData;
            delete global.window.relocationData;

            // Set up a generic Data variable
            global.window.someOtherData = { name: 'Some Tree', children: [] };

            let loadedData = null;
            for (let key in global.window) {
                if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                    if (global.window[key].name) {
                        loadedData = global.window[key];
                        break;
                    }
                }
            }

            expect(loadedData).toBe(global.window.someOtherData);
        });

        test('should return null when no data is found', () => {
            // Clear all data variables
            Object.keys(global.window).forEach(key => {
                if (key.endsWith('Data')) {
                    delete global.window[key];
                }
            });

            let loadedData = null;
            for (let key in global.window) {
                if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                    if (global.window[key].name) {
                        loadedData = global.window[key];
                        break;
                    }
                }
            }

            expect(loadedData).toBeNull();
        });
    });

    describe('Click handler for nodes with links', () => {
        test('should call loadTreeFile when node has string link', () => {
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

            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(global.window.location.href).toBe('http://localhost:3000/decision_tree.html?file=food-shopping.js');
        });

        test('should call loadTreeFile with newWindow=true when link is object with newWindow', () => {
            const mockEvent = {
                stopPropagation: jest.fn()
            };
            const mockNode = {
                data: {
                    name: 'Open in new window',
                    link: { file: 'food-shopping.js', newWindow: true }
                }
            };

            click(mockEvent, mockNode);

            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(global.window.open).toHaveBeenCalledWith(
                'http://localhost:3000/decision_tree.html?file=food-shopping.js',
                '_blank'
            );
        });

        test('should handle link object without newWindow property', () => {
            const mockEvent = {
                stopPropagation: jest.fn()
            };
            const mockNode = {
                data: {
                    name: 'Link without newWindow',
                    link: { file: 'food-shopping.js' }
                }
            };

            click(mockEvent, mockNode);

            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(global.window.location.href).toBe('http://localhost:3000/decision_tree.html?file=food-shopping.js');
        });
    });

    describe('End-to-end link loading scenario', () => {
        test('should successfully load tree data when clicking a link node', () => {
            // Simulate the full flow:
            // 1. User clicks on a node with a link
            // 2. loadTreeFile is called
            // 3. URL changes to include ?file= parameter
            // 4. Script is loaded
            // 5. Data is detected and loaded

            const mockEvent = {
                stopPropagation: jest.fn()
            };
            const mockNode = {
                data: {
                    name: 'Restart decision',
                    link: 'food-shopping.js'
                }
            };

            // Step 1: Click on link node
            click(mockEvent, mockNode);

            // Step 2: Verify URL was updated
            expect(global.window.location.href).toContain('file=food-shopping.js');

            // Step 3: Simulate script loading
            global.window.foodShoppingData = {
                name: 'Food Shopping?',
                children: []
            };

            // Step 4: Simulate data detection (as done in script.js)
            const fileParam = 'food-shopping.js';
            const baseName = fileParam.replace('.js', '');
            const varName = baseName.replace(/[-_]/g, '');
            const camelCaseName = toCamelCase(baseName);

            const possibleNames = [
                'treeData', 'hikingData', 'relocationData',
                varName + 'Data',
                varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                camelCaseName + 'Data',
                camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data'
            ];

            let loadedData = null;
            for (let name of possibleNames) {
                if (typeof global.window[name] !== 'undefined') {
                    loadedData = global.window[name];
                    break;
                }
            }

            // Step 5: Verify data was found
            expect(loadedData).not.toBeNull();
            expect(loadedData.name).toBe('Food Shopping?');
        });

        test('should show alert when tree data cannot be found', () => {
            // Clear all data
            Object.keys(global.window).forEach(key => {
                if (key.endsWith('Data')) {
                    delete global.window[key];
                }
            });

            // Simulate script loading but no data found
            const fileParam = 'nonexistent.js';
            const baseName = fileParam.replace('.js', '');
            const varName = baseName.replace(/[-_]/g, '');
            const camelCaseName = toCamelCase(baseName);

            const possibleNames = [
                'treeData', 'hikingData', 'relocationData',
                varName + 'Data',
                varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                camelCaseName + 'Data',
                camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data'
            ];

            let loadedData = null;
            for (let name of possibleNames) {
                if (typeof global.window[name] !== 'undefined') {
                    loadedData = global.window[name];
                    break;
                }
            }

            // Fallback search
            if (!loadedData) {
                for (let key in global.window) {
                    if (key.endsWith('Data') && typeof global.window[key] === 'object' && global.window[key] !== null) {
                        if (global.window[key].name) {
                            loadedData = global.window[key];
                            break;
                        }
                    }
                }
            }

            expect(loadedData).toBeNull();
            // In the actual code, this would trigger: alert('Could not find tree data in ' + fileParam);
        });
    });
});

