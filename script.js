// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
// Display current directory path
const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
// Decode URI component to handle spaces and special chars
const pathElement = document.getElementById('current-path');
if (pathElement) {
    pathElement.textContent = decodeURIComponent(currentPath);
}

// Set the dimensions and margins of the diagram
const margin = { top: 70, right: 200, bottom: 30, left: 90 };
// Use a large initial size to allow for infinite expansion
let baseWidth = Math.max(window.innerWidth - margin.left - margin.right, 2000);
let baseHeight = Math.max(window.innerHeight - margin.top - margin.bottom, 2000);

// Store reference to the SVG element
const svgElement = d3.select("#tree-container").append("svg")
    .attr("width", baseWidth + margin.right + margin.left)
    .attr("height", baseHeight + margin.top + margin.bottom)
    .style("min-width", "100%")
    .style("min-height", "100vh");

const svg = svgElement.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Initialize variables
let data = null;
let root = null;
let i = 0;
const duration = 750;
// Use large initial size - will be recalculated based on actual tree content
let treemap = d3.tree().size([baseHeight, baseWidth]);

// --- Interactive Mode Logic ---
window.isEditMode = false;
let selectedNode = null;

// Toggle Edit Mode
const editToggle = document.getElementById('edit-mode-toggle');
if (editToggle) {
    editToggle.addEventListener('change', function (e) {
        window.isEditMode = e.target.checked;
        // Edit controls visibility is now handled by CSS (body.edit-mode #title-controls #edit-controls)

        // Visual feedback
        if (window.isEditMode) {
            document.body.classList.add('edit-mode');
        } else {
            document.body.classList.remove('edit-mode');
            hideContextMenu();
        }
    });
}

// Context Menu Logic
const contextMenu = document.getElementById('context-menu');

function showContextMenu(event, d) {
    selectedNode = d;
    if (contextMenu) {
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
    }
}

function hideContextMenu() {
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
    selectedNode = null;
}

// Close context menu on click outside
document.addEventListener('click', function (e) {
    if (contextMenu && !contextMenu.contains(e.target)) {
        hideContextMenu();
    }
});

// Add Child
const menuAddChild = document.getElementById('menu-add-child');
if (menuAddChild) {
    menuAddChild.addEventListener('click', async function () {
        if (selectedNode) {
            const newChild = { name: "New Node", children: [] };
            if (!selectedNode.data.children) {
                selectedNode.data.children = [];
            }
            selectedNode.data.children.push(newChild);

            // Expand the node to show the new child
            if (selectedNode._children) {
                selectedNode.children = selectedNode._children;
                selectedNode._children = null;
            }

            update(root);
            
            // Auto-save after adding child
            await autoSaveTree();
            
            hideContextMenu();
        }
    });
}

// Function to refresh the UI after edits
function refreshUI() {
    if (root) {
        update(root);
    }
}

// Helper function to clean tree data for saving
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

// Auto-save function to save tree data to file
async function autoSaveTree() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    
    if (!fileParam) {
        return; // No file to save to
    }
    
    try {
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
        if (!result.success) {
            console.warn("Auto-save failed:", result.error);
        } else {
            console.log('[DEBUG] Auto-save successful for', fileParam);
        }
    } catch (error) {
        console.error("Auto-save error:", error);
    }
}

// Edit Text
const menuEditNode = document.getElementById('menu-edit-node');
if (menuEditNode) {
    menuEditNode.addEventListener('click', async function () {
        if (selectedNode) {
            const newName = prompt("Enter new text:", selectedNode.data.name);
            if (newName !== null && newName !== selectedNode.data.name) {
                selectedNode.data.name = newName;
                
                // Refresh the UI immediately
                refreshUI();
                
                // Auto-save to file if we have a current filename
                await autoSaveTree();
            }
            hideContextMenu();
        }
    });
}

// Delete Node
const menuDeleteNode = document.getElementById('menu-delete-node');
if (menuDeleteNode) {
    menuDeleteNode.addEventListener('click', async function () {
        if (selectedNode && selectedNode.parent) {
            if (confirm(`Delete "${selectedNode.data.name}" and its children ? `)) {
                const siblings = selectedNode.parent.data.children;
                const index = siblings.indexOf(selectedNode.data);
                if (index > -1) {
                    siblings.splice(index, 1);
                    update(root);
                    
                    // Auto-save after deleting node
                    await autoSaveTree();
                }
            }
            hideContextMenu();
        } else if (selectedNode && !selectedNode.parent) {
            alert("Cannot delete the root node.");
            hideContextMenu();
        }
    });
}

// Generate Children (AI) - Helper Functions

/**
 * Gets the path from root to the given node
 * @param {Object} node - The D3 hierarchy node
 * @returns {Array} Array of node names from root to current node
 */
function getNodePath(node) {
    let path = [];
    let current = node;
    while (current) {
        path.unshift(current.data.name);
        current = current.parent;
    }
    return path;
}

/**
 * Gets all branches (sibling nodes) for the given node
 * @param {Object} node - The D3 hierarchy node
 * @returns {Array} Array of sibling node names
 */
function getNodeBranches(node) {
    if (!node.parent || !node.parent.data.children) {
        return [];
    }
    return node.parent.data.children.map(child => child.name);
}

/**
 * Formats the prompt to send to Ollama
 * @param {string} pathString - The path string from root to current node
 * @param {Array} branches - Array of sibling node names
 * @returns {string} Formatted prompt string
 */
function formatPromptForOllama(pathString, branches) {
    const branchesText = branches.length > 0 
        ? ` Existing branches at this level: ${branches.join(", ")}.`
        : "";
    return `Given the decision tree path: "${pathString}",${branchesText} suggest 2 to 3 logical next distinct options or steps. Return ONLY a JSON array of strings, e.g., ["Option A", "Option B"]. Do not include any other text.`;
}

/**
 * Parses the response from Ollama API
 * @param {Object} data - Response data from Ollama
 * @returns {Array|null} Parsed array of options or null if parsing fails
 */
function parseOllamaResponse(data) {
    console.log('[DEBUG] Parsing Ollama response:', data);
    
    if (!data || !data.response) {
        console.error('[DEBUG] Invalid response data:', data);
        return null;
    }

    let jsonStr = data.response;
    console.log('[DEBUG] Raw response string:', jsonStr);
    
    const start = jsonStr.indexOf('[');
    const end = jsonStr.lastIndexOf(']');
    
    console.log('[DEBUG] JSON array boundaries - start:', start, 'end:', end);

    if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
        console.log('[DEBUG] Extracted JSON string:', jsonStr);
        
        try {
            const options = JSON.parse(jsonStr);
            console.log('[DEBUG] Parsed options:', options);
            
            if (Array.isArray(options)) {
                return options;
            } else {
                console.error('[DEBUG] Parsed result is not an array:', options);
                return null;
            }
        } catch (parseError) {
            console.error('[DEBUG] JSON parse error:', parseError);
            return null;
        }
    } else {
        console.error('[DEBUG] Could not find JSON array boundaries in response');
        return null;
    }
}

/**
 * Adds children nodes to the given node
 * @param {Object} nodeRef - The D3 hierarchy node reference
 * @param {Array} childrenNames - Array of child node names to add
 */
function addChildrenToNode(nodeRef, childrenNames) {
    console.log('[DEBUG] Adding children to node:', nodeRef.data.name);
    console.log('[DEBUG] Children to add:', childrenNames);
    
    if (!nodeRef.data.children) {
        nodeRef.data.children = [];
    }
    
    childrenNames.forEach(opt => {
        nodeRef.data.children.push({ name: opt, children: [] });
    });
    
    console.log('[DEBUG] Node now has', nodeRef.data.children.length, 'children');

    // Expand the node to show new children
    if (nodeRef._children) {
        nodeRef.children = nodeRef._children;
        nodeRef._children = null;
    }
}

/**
 * Gets root node information for debugging
 * @param {Object} rootNode - The root D3 hierarchy node
 * @returns {Object} Root node information
 */
function getRootNodeInfo(rootNode) {
    if (!rootNode) {
        return { name: 'N/A', depth: 0, totalNodes: 0 };
    }
    
    const descendants = rootNode.descendants ? rootNode.descendants() : [];
    return {
        name: rootNode.data ? rootNode.data.name : 'N/A',
        depth: rootNode.depth || 0,
        totalNodes: descendants.length
    };
}

// Generate Children (AI)
const menuGenerateAI = document.getElementById('menu-generate-ai');

// Create spinner element dynamically
const spinner = document.createElement('div');
spinner.className = 'spinner';
spinner.id = 'ai-spinner';
spinner.style.display = 'none';
spinner.style.position = 'fixed';
spinner.style.top = '20px';
spinner.style.right = '20px';
spinner.style.zIndex = '1000';
document.body.appendChild(spinner);

if (menuGenerateAI) {
    menuGenerateAI.addEventListener('click', async function () {
        if (selectedNode) {
            console.log('[DEBUG] ========== Generate Children Clicked ==========');
            
            // Fix: Save reference to selectedNode before hideContextMenu() clears it
            const nodeRef = selectedNode;
            const nodeName = nodeRef.data.name;
            
            // Get root node info for debugging
            const rootInfo = getRootNodeInfo(root);
            console.log('[DEBUG] Root node info:', rootInfo);
            console.log('[DEBUG] Root node name:', rootInfo.name);
            console.log('[DEBUG] Root node total descendants:', rootInfo.totalNodes);

            // Construct path context
            const path = getNodePath(nodeRef);
            const pathString = path.join(" > ");
            console.log('[DEBUG] Node path array:', path);
            console.log('[DEBUG] Node path string:', pathString);
            
            // Get branches (sibling nodes) for context
            const branches = getNodeBranches(nodeRef);
            console.log('[DEBUG] Existing branches at this level:', branches);

            // Format prompt
            const prompt = formatPromptForOllama(pathString, branches);
            console.log('[DEBUG] Formatted prompt to send to Ollama:', prompt);
            
            // Prepare request body
            const requestBody = { prompt: prompt };
            console.log('[DEBUG] Request body being sent to /api/generate:', JSON.stringify(requestBody, null, 2));

            // Show loading state
            spinner.style.display = 'block';
            hideContextMenu(); // This sets selectedNode = null, but we have nodeRef

            try {
                console.log('[DEBUG] Sending request to /api/generate...');
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                console.log('[DEBUG] Response status:', response.status, response.statusText);

                // Check if response is ok
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('[DEBUG] Response not OK. Error data:', errorData);
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();
                console.log('[DEBUG] Received response data:', data);
                
                // Check if data is null or undefined
                if (!data) {
                    console.error('[DEBUG] Response data is null or undefined');
                    throw new Error('Received null or undefined response from server');
                }

                // Check if this is an error response
                if (data.error) {
                    console.error('[DEBUG] Error in response:', data.error, data.details);
                    throw new Error(data.error + (data.details ? ': ' + data.details : ''));
                }

                // Check if response property exists
                if (!data.response) {
                    console.error('[DEBUG] Response does not contain "response" field. Data keys:', Object.keys(data));
                    throw new Error('Response does not contain expected "response" field');
                }

                // Parse the response
                const options = parseOllamaResponse(data);

                if (options && Array.isArray(options) && options.length > 0) {
                    console.log('[DEBUG] Successfully parsed', options.length, 'options');
                    addChildrenToNode(nodeRef, options);
                    console.log('[DEBUG] Children added successfully');
                    
                    // Auto-save after adding AI-generated children
                    await autoSaveTree();
                } else {
                    console.error('[DEBUG] Failed to parse valid options from response');
                    alert("AI generation failed to produce a valid list.");
                }

            } catch (error) {
                console.error('[DEBUG] AI Generation Error:', error);
                console.error('[DEBUG] Error stack:', error.stack);
                alert("Error generating children: " + error.message);
            } finally {
                spinner.style.display = 'none';
                update(root);
                console.log('[DEBUG] ========== Generate Children Complete ==========');
            }
        } else {
            console.warn('[DEBUG] Generate Children clicked but no node selected');
        }
    });
}

// Save Tree
const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
        const filenameInput = document.getElementById('save-filename');
        const filename = filenameInput ? filenameInput.value : null;

        if (!filename) {
            alert("Please enter a filename.");
            return;
        }

        const treeDataToSave = cleanData(root.data);

        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: filename,
                    treeData: treeDataToSave
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("Tree saved successfully!");
            } else {
                alert("Error saving tree: " + result.error);
            }
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save tree.");
        }
    });
}

// New Tree
const newTreeBtn = document.getElementById('new-tree-btn');
if (newTreeBtn) {
    newTreeBtn.addEventListener('click', function () {
        if (confirm("Create a new tree? Unsaved changes will be lost.")) {
            const newTree = { name: "Root", children: [] };
            loadTreeData(newTree);
            const filenameInput = document.getElementById('save-filename');
            if (filenameInput) filenameInput.value = "new-tree.js";
        }
    });
}

// Function to load a decision tree file
function loadTreeFile(filename, openInNewWindow) {
    if (openInNewWindow) {
        // Open in new window/tab
        const url = window.location.href.split('?')[0] + '?file=' + encodeURIComponent(filename);
        window.open(url, '_blank');
    } else {
        // Load in same window
        window.location.href = window.location.href.split('?')[0] + '?file=' + encodeURIComponent(filename);
    }
}

// Function to update the tree title
function updateTreeTitle(treeData, filename) {
    const titleTextElement = document.getElementById('title-text');
    if (titleTextElement) {
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
            titleTextElement.textContent = titleText;
            titleTextElement.style.display = 'block';
        } else {
            titleTextElement.style.display = 'none';
        }
    }
    
    // Always show title bar when we have controls
    const titleElement = document.getElementById('tree-title');
    if (titleElement) {
        titleElement.style.display = 'flex';
    }
}

// Function to load and render tree data
function loadTreeData(treeData, filename) {
    // Clear existing tree
    svg.selectAll("*").remove();
    i = 0;

    // Use the provided data or try to find it in global scope
    if (treeData) {
        data = treeData;
    } else {
        // Try to find data from loaded scripts
        if (typeof window.treeData !== 'undefined') {
            data = window.treeData;
        } else if (typeof window.hikingData !== 'undefined') {
            data = window.hikingData;
        } else if (typeof window.relocationData !== 'undefined') {
            data = window.relocationData;
        } else {
            console.error('No tree data found');
            return;
        }
    }

    // Update tree title - use provided filename or get from URL
    if (!filename) {
        const urlParams = new URLSearchParams(window.location.search);
        filename = urlParams.get('file');
    }
    updateTreeTitle(data, filename);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(data, function (d) { return d.children; });
    // Calculate height from SVG or use baseHeight
    const currentHeight = parseFloat(svgElement.attr("height")) || baseHeight;
    root.x0 = currentHeight / 2;
    // Position root 5% from left edge of screen
    const rootOffset = window.innerWidth * 0.05 - margin.left;
    root.y0 = rootOffset;

    // Collapse all nodes initially
    if (root.children) {
        root.children.forEach(collapse);
    }

    update(root);
}

// Handle file input
const fileInput = document.getElementById('data-file-input');
if (fileInput) {
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.js')) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const fileContent = event.target.result;
                const varMatch = fileContent.match(/(?:const|let|var)\s+(\w+)\s*=/);
                let expectedVarName = null;

                if (varMatch && varMatch[1]) {
                    expectedVarName = varMatch[1];
                }

                let modifiedContent = fileContent;
                if (expectedVarName) {
                    modifiedContent = fileContent.replace(
                        new RegExp(`(const|let|var)\\s+${expectedVarName}\\s*=`),
                        `window.${expectedVarName} =`
                    );
                }

                const script = document.createElement('script');
                script.textContent = modifiedContent;
                document.body.appendChild(script);

                setTimeout(function () {
                    let loadedData = null;
                    if (expectedVarName && typeof window[expectedVarName] !== 'undefined') {
                        loadedData = window[expectedVarName];
                    }

                    if (!loadedData) {
                        for (let key in window) {
                            if (key.endsWith('Data') && typeof window[key] === 'object' && window[key] !== null) {
                                if (window[key].name) {
                                    loadedData = window[key];
                                    break;
                                }
                            }
                        }
                    }

                    if (loadedData) {
                        // Update URL to reflect loaded file
                        const newUrl = window.location.href.split('?')[0] + '?file=' + encodeURIComponent(file.name);
                        window.history.pushState({}, '', newUrl);
                        loadTreeData(loadedData, file.name);
                    } else {
                        alert('Could not find tree data in the loaded file.');
                    }

                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                }, 10);
            };
            reader.readAsText(file);
        }
    });
}

function loadScript(filename, callback) {
    const existingScript = document.querySelector(`script[data-tree-file="${filename}"]`);
    if (existingScript) {
        existingScript.remove();
    }

    const script = document.createElement('script');
    script.setAttribute('data-tree-file', filename);
    script.src = filename;
    script.onload = callback;
    script.onerror = function () {
        alert('Failed to load file: ' + filename);
    };
    document.head.appendChild(script);
}

function toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    }
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    const path = `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
          ${(s.y + d.y) / 2} ${d.x},
          ${d.y} ${d.x}`
    return path
}

// Toggle children on click.
function click(event, d) {
    // Edit Mode Interaction
    if (window.isEditMode) {
        event.stopPropagation();
        showContextMenu(event, d);
        return;
    }

    // Check if node has a link
    if (d.data.link) {
        event.stopPropagation();
        const linkData = d.data.link;
        const filename = typeof linkData === 'string' ? linkData : linkData.file;
        const openInNewWindow = typeof linkData === 'object' && linkData.newWindow === true;
        loadTreeFile(filename, openInNewWindow);
        return;
    }

    // Normal expand/collapse behavior
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

function update(source) {

    // Calculate maximum depth first to determine required width
    const nodeSpacing = 180;
    const verticalSpacing = 100; // Spacing between nodes vertically
    
    // Calculate tree structure first to determine dimensions needed
    treemap.size([baseHeight, baseWidth]);
    const tempTreeData = treemap(root);
    const tempNodes = tempTreeData.descendants();
    
    // Calculate required dimensions based on actual tree structure
    const maxDepth = tempNodes.length > 0 ? d3.max(tempNodes, function(d) { return d.depth; }) : 0;
    
    // Calculate required height based on number of nodes at each level
    let maxNodesAtLevel = 0;
    const nodesByLevel = {};
    tempNodes.forEach(function(d) {
        if (!nodesByLevel[d.depth]) {
            nodesByLevel[d.depth] = [];
        }
        nodesByLevel[d.depth].push(d);
        maxNodesAtLevel = Math.max(maxNodesAtLevel, nodesByLevel[d.depth].length);
    });
    
    // Calculate dimensions needed - ensure they're large enough
    const requiredWidth = Math.max(baseWidth, (maxDepth + 1) * nodeSpacing + margin.right + 200);
    const requiredHeight = Math.max(baseHeight, maxNodesAtLevel * verticalSpacing + margin.top + margin.bottom + 200);
    
    // Update treemap size to use calculated dimensions
    treemap.size([requiredHeight, requiredWidth]);
    
    // Assigns the x and y position for the nodes
    const treeData = treemap(root);

    // Compute the new tree layout.
    const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    // Calculate 5% offset from left edge of screen for root node
    const rootOffset = window.innerWidth * 0.05 - margin.left;
    nodes.forEach(function (d) { 
        d.y = d.depth * nodeSpacing + (d.depth === 0 ? rootOffset : 0);
    });
    
    // Find actual bounds of the tree after normalization
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(function(d) {
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
    });
    
    // Add padding around the tree and ensure minimum size
    const padding = 100;
    const actualWidth = Math.max(requiredWidth, maxY - minY + margin.left + margin.right + padding * 2, window.innerWidth);
    const actualHeight = Math.max(requiredHeight, maxX - minX + margin.top + margin.bottom + padding * 2, window.innerHeight);
    
    // Update SVG dimensions to accommodate the full tree
    const currentSvgWidth = parseFloat(svgElement.attr("width")) || 0;
    const currentSvgHeight = parseFloat(svgElement.attr("height")) || 0;
    const newSvgWidth = Math.max(currentSvgWidth, actualWidth);
    const newSvgHeight = Math.max(currentSvgHeight, actualHeight);
    
    if (currentSvgWidth < newSvgWidth || currentSvgHeight < newSvgHeight) {
        svgElement.attr("width", newSvgWidth);
        svgElement.attr("height", newSvgHeight);
    }

    // ****************** Nodes section ******************

    // Update the nodes...
    const node = svg.selectAll('g.node')
        .data(nodes, function (d) { return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', function (d) {
            let classes = 'node';
            if (d.data.link) {
                classes += ' node--link';
            }
            return classes;
        })
        .attr('r', 1e-6)
        .style("fill", function (d) {
            if (d.data.link) {
                return "#e74c3c";
            }
            return d._children ? "lightsteelblue" : "#fff";
        })
        .style("stroke", function (d) {
            if (d.data.link) {
                return "#c0392b";
            }
            return "#3498db";
        });

    // Add link icon for nodes with links
    nodeEnter.append('text')
        .attr('class', 'link-icon')
        .attr("dy", ".35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .style("opacity", function (d) {
            return d.data.link ? 1 : 0;
        })
        .text(function (d) {
            return d.data.link ? "🔗" : "";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr('class', 'node-label')
        .attr("dy", ".35em")
        .attr("x", function (d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) { return d.data.name; });

    // UPDATE
    const nodeUpdate = node.merge(nodeEnter);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", function (d) {
            if (d.data.link) {
                return "#e74c3c";
            }
            return d._children ? "lightsteelblue" : "#fff";
        })
        .style("stroke", function (d) {
            if (d.data.link) {
                return "#c0392b";
            }
            return "#3498db";
        })
        .attr('cursor', 'pointer');

    // Update text labels for existing nodes
    nodeUpdate.select('text.node-label')
        .text(function (d) { return d.data.name; });


    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** Links section ******************

    // Update the links...
    const link = svg.selectAll('path.link')
        .data(links, function (d) { return d.id; });

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            const o = { x: source.x0, y: source.y0 }
            return diagonal(o, o)
        });

    // UPDATE
    const linkUpdate = link.merge(linkEnter);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) { return diagonal(d, d.parent) });

    // Remove any exiting links
    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            const o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Handle window resize - update base dimensions but don't constrain tree
window.addEventListener('resize', function() {
    if (root) {
        // Update base dimensions but keep them large enough for infinite expansion
        baseWidth = Math.max(window.innerWidth - margin.left - margin.right, 2000);
        baseHeight = Math.max(window.innerHeight - margin.top - margin.bottom, 2000);
        // Recalculate tree layout - update function will handle actual sizing
        update(root);
    }
});

// Update tree title on initial load
window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    // Title will be updated when tree data is loaded
});

// Fuzzy Search Implementation
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1,     // insertion
                    dp[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }

    return dp[m][n];
}

function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLen);
}

function fuzzySearch(query, items, threshold = 0.3) {
    if (!query || query.trim().length === 0) {
        return items.map(item => ({ item, score: 1.0 }));
    }

    const queryLower = query.toLowerCase().trim();
    const results = [];

    items.forEach(item => {
        let maxScore = 0;
        
        // Check filename match
        const filename = item.filename || item;
        const filenameLower = filename.toLowerCase();
        
        // Exact match gets highest score
        if (filenameLower.includes(queryLower)) {
            maxScore = Math.max(maxScore, 0.9);
        }
        
        // Check each word in filename
        const filenameWords = filenameLower.split(/[-_.]/);
        filenameWords.forEach(word => {
            if (word.includes(queryLower)) {
                maxScore = Math.max(maxScore, 0.8);
            }
            const similarity = calculateSimilarity(queryLower, word);
            if (similarity > threshold) {
                maxScore = Math.max(maxScore, similarity);
            }
        });

        // Check content snippets if available
        if (item.snippets) {
            item.snippets.forEach(snippet => {
                const snippetLower = snippet.toLowerCase();
                if (snippetLower.includes(queryLower)) {
                    maxScore = Math.max(maxScore, 0.7);
                }
                // Check individual words in snippet
                snippetLower.split(' ').forEach(word => {
                    const similarity = calculateSimilarity(queryLower, word);
                    if (similarity > threshold) {
                        maxScore = Math.max(maxScore, similarity * 0.6);
                    }
                });
            });
        }

        if (maxScore > threshold) {
            results.push({ item, score: maxScore });
        }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results;
}

// Search functionality
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout = null;
let allFiles = [];

// Load all files on page load
async function loadAllFiles() {
    try {
        const response = await fetch('/api/search-files');
        const data = await response.json();
        allFiles = data.files || [];
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Perform search
async function performSearch(query) {
    if (!query || query.trim().length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/search-files?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        const files = data.files || [];

        // Apply fuzzy search
        const fuzzyResults = fuzzySearch(query, files, 0.2);

        if (fuzzyResults.length === 0) {
            searchResults.innerHTML = '<div style="padding: 10px; color: #666; font-size: 0.9em;">No matches found</div>';
            searchResults.style.display = 'block';
            return;
        }

        // Display results
        searchResults.innerHTML = fuzzyResults.map(({ item, score }) => {
            const filename = item.filename || item;
            const scorePercent = Math.round(score * 100);
            const matchType = item.filenameMatch ? 'filename' : 'content';
            return `
                <div class="search-result-item" data-filename="${filename}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #3498db;">${filename}</div>
                        ${item.snippets && item.snippets.length > 0 ? 
                            `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">${item.snippets[0].substring(0, 50)}...</div>` : 
                            ''}
                    </div>
                    <div style="font-size: 0.75em; color: #999;">${scorePercent}%</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                loadTreeFile(filename, false);
            });
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f5f5f5';
            });
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
            });
        });

        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Error performing search:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        logBrowserError({
            error: `Search failed: ${errorMessage}`,
            source: 'performSearch',
            message: `Failed to search for query: "${query}" | Error: ${errorMessage}`,
            stack: error instanceof Error ? error.stack : null
        });
        searchResults.innerHTML = '<div style="padding: 10px; color: #e74c3c;">Error searching files</div>';
        searchResults.style.display = 'block';
    }
}

// Search input event listener
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value;
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Close results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Load default data on page load
window.addEventListener('load', function () {
    loadAllFiles();
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');

    if (fileParam) {
        loadScript(fileParam, function () {
            setTimeout(() => {
                let loadedData = null;
                const baseName = fileParam.replace('.js', '');
                const varName = baseName.replace(/[-_]/g, '');
                const camelCaseName = toCamelCase(baseName);

                // Prioritize filename-derived variable names over hardcoded ones
                // This ensures that food-shopping.js loads foodShoppingData, not hikingData
                // Check treeData early since many files use window.treeData
                const possibleNames = [
                    camelCaseName + 'Data',
                    camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data',
                    varName + 'Data',
                    varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                    // Check treeData before other fallbacks since many files use window.treeData
                    'treeData',
                    // Fallback to other common names only if filename-derived names don't match
                    'hikingData', 'relocationData'
                ];

                for (let name of possibleNames) {
                    if (typeof window[name] !== 'undefined') {
                        loadedData = window[name];
                        break;
                    }
                }

                if (!loadedData) {
                    // Fallback: Try to match filename to variable name before picking first match
                    // This prevents food-shopping.js from loading hikingData when both exist
                    const normalizedBaseName = baseName.toLowerCase().replace(/[-_]/g, '');
                    const normalizedCamelCase = camelCaseName.toLowerCase();
                    
                    let bestMatch = null;
                    let bestMatchScore = 0;
                    
                    for (let key in window) {
                        if (key.endsWith('Data') && typeof window[key] === 'object' && window[key] !== null) {
                            if (window[key].name) {
                                const normalizedKey = key.toLowerCase().replace('data', '');
                                
                                // Score matches: exact match gets highest priority
                                let score = 0;
                                if (normalizedKey === normalizedBaseName || normalizedKey === normalizedCamelCase) {
                                    score = 100; // Exact match - use immediately
                                    loadedData = window[key];
                                    break;
                                } else if (normalizedKey.includes(normalizedBaseName) || normalizedBaseName.includes(normalizedKey)) {
                                    score = 50; // Partial match
                                } else {
                                    score = 1; // Any match (lowest priority)
                                }
                                
                                if (score > bestMatchScore) {
                                    bestMatch = window[key];
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
                            for (let key in window) {
                                if (key.endsWith('Data') && typeof window[key] === 'object' && window[key] !== null) {
                                    if (window[key].name) {
                                        loadedData = window[key];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                if (loadedData) {
                    loadTreeData(loadedData, fileParam);
                } else {
                    alert('Could not find tree data in ' + fileParam);
                    if (typeof treeData !== 'undefined') {
                        loadTreeData(treeData, fileParam);
                    }
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (typeof treeData !== 'undefined') {
                loadTreeData(treeData);
            } else if (typeof hikingData !== 'undefined') {
                loadTreeData(hikingData);
            } else {
                console.error('No default tree data found. Please load a .js file.');
            }
        }, 100);
    }
});

// ==================== Browser Error Tracking ====================
// Store original console methods BEFORE overriding them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Function to send browser errors to server for logging
function logBrowserError(errorInfo) {
    try {
        const errorData = {
            error: errorInfo.message || errorInfo.error || String(errorInfo),
            source: errorInfo.source || errorInfo.filename || 'unknown',
            lineno: errorInfo.lineno || errorInfo.line || null,
            colno: errorInfo.colno || errorInfo.column || null,
            stack: errorInfo.stack || null,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Send to server (fire and forget - don't wait for response)
        fetch('/api/log-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorData)
        }).catch(err => {
            // Silently fail if server is not available - use original console.error to avoid recursion
            originalConsoleError('Failed to log error to server:', err);
        });
    } catch (err) {
        // Silently fail if error logging itself fails - use original console.error to avoid recursion
        originalConsoleError('Error in logBrowserError:', err);
    }
}

// Override console.error to also log to server
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    
    // Extract error information
    const errorMessage = args.map(arg => {
        if (arg instanceof Error) {
            return arg.message + (arg.stack ? '\n' + arg.stack : '');
        }
        return String(arg);
    }).join(' ');
    
    logBrowserError({
        error: errorMessage,
        source: 'console.error',
        stack: args.find(arg => arg instanceof Error)?.stack || null
    });
};

// Override console.warn to also log to server
console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    
    const warningMessage = args.map(arg => String(arg)).join(' ');
    
    logBrowserError({
        error: `Warning: ${warningMessage}`,
        source: 'console.warn'
    });
};

// Global error handler for uncaught errors
window.addEventListener('error', function(event) {
    logBrowserError({
        message: event.message,
        source: event.filename || event.source || 'unknown',
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack || null
    });
}, true);

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    logBrowserError({
        error: `Unhandled Promise Rejection: ${event.reason}`,
        source: 'unhandledrejection',
        stack: event.reason?.stack || String(event.reason)
    });
});

// Also catch errors via window.onerror (older method, for compatibility)
window.onerror = function(message, source, lineno, colno, error) {
    logBrowserError({
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error,
        stack: error?.stack || null
    });
    // Return false to allow default error handling
    return false;
};
