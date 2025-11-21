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
let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - margin.top - margin.bottom;

// Store reference to the SVG element
const svgElement = d3.select("#tree-container").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

const svg = svgElement.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Initialize variables
let data = null;
let root = null;
let i = 0;
const duration = 750;
let treemap = d3.tree().size([height, width]);

// --- Interactive Mode Logic ---
window.isEditMode = false;
let selectedNode = null;

// Toggle Edit Mode
const editToggle = document.getElementById('edit-mode-toggle');
if (editToggle) {
    editToggle.addEventListener('change', function (e) {
        window.isEditMode = e.target.checked;
        const editControls = document.getElementById('edit-controls');
        if (editControls) {
            editControls.style.display = window.isEditMode ? 'flex' : 'none';
        }

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
    menuAddChild.addEventListener('click', function () {
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
                const urlParams = new URLSearchParams(window.location.search);
                const fileParam = urlParams.get('file');
                if (fileParam) {
                    try {
                        // Get current tree data
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
                        if (!result.success) {
                            console.warn("Auto-save failed:", result.error);
                        }
                    } catch (error) {
                        console.error("Auto-save error:", error);
                    }
                }
            }
            hideContextMenu();
        }
    });
}

// Delete Node
const menuDeleteNode = document.getElementById('menu-delete-node');
if (menuDeleteNode) {
    menuDeleteNode.addEventListener('click', function () {
        if (selectedNode && selectedNode.parent) {
            if (confirm(`Delete "${selectedNode.data.name}" and its children ? `)) {
                const siblings = selectedNode.parent.data.children;
                const index = siblings.indexOf(selectedNode.data);
                if (index > -1) {
                    siblings.splice(index, 1);
                    update(root);
                }
            }
            hideContextMenu();
        } else if (selectedNode && !selectedNode.parent) {
            alert("Cannot delete the root node.");
            hideContextMenu();
        }
    });
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
            // Fix: Save reference to selectedNode before hideContextMenu() clears it
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

            // Show loading state
            spinner.style.display = 'block';
            const originalText = nodeRef.data.name;
            // nodeRef.data.name = originalText + " (Generating...)"; // Optional: keep text update
            // update(root);
            hideContextMenu(); // This sets selectedNode = null, but we have nodeRef

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: `Given the decision tree path: "${pathString}", suggest 2 to 3 logical next distinct options or steps.Return ONLY a JSON array of strings, e.g., ["Option A", "Option B"].Do not include any other text.`
                    })
                });

                // Check if response is ok
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();
                
                // Check if data is null or undefined
                if (!data) {
                    throw new Error('Received null or undefined response from server');
                }

                // Check if this is an error response
                if (data.error) {
                    throw new Error(data.error + (data.details ? ': ' + data.details : ''));
                }

                // Check if response property exists
                if (!data.response) {
                    throw new Error('Response does not contain expected "response" field');
                }

                let jsonStr = data.response;
                const start = jsonStr.indexOf('[');
                const end = jsonStr.lastIndexOf(']');

                if (start !== -1 && end !== -1) {
                    jsonStr = jsonStr.substring(start, end + 1);
                    const options = JSON.parse(jsonStr);

                    if (Array.isArray(options)) {
                        // Fix: Use nodeRef instead of selectedNode (which is now null)
                        if (!nodeRef.data.children) nodeRef.data.children = [];
                        options.forEach(opt => {
                            nodeRef.data.children.push({ name: opt, children: [] });
                        });

                        // Expand
                        if (nodeRef._children) {
                            nodeRef.children = nodeRef._children;
                            nodeRef._children = null;
                        }
                    }
                } else {
                    console.error("Could not parse AI response:", data.response);
                    alert("AI generation failed to produce a valid list.");
                }

            } catch (error) {
                console.error("AI Generation Error:", error);
                alert("Error generating children: " + error.message);
            } finally {
                spinner.style.display = 'none';
                // nodeRef.data.name = originalText;
                update(root);
            }
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
    const titleElement = document.getElementById('tree-title');
    if (titleElement) {
        let titleText = '';
        
        // Use the root node name if available
        if (treeData && treeData.name) {
            titleText = treeData.name;
        } else if (filename) {
            // Fallback to filename without extension
            titleText = filename.replace('.js', '').replace(/[-_]/g, ' ');
            // Capitalize first letter of each word
            titleText = titleText.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        
        if (titleText) {
            titleElement.textContent = titleText;
            titleElement.style.display = 'block';
        } else {
            titleElement.style.display = 'none';
        }
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
    root.x0 = height / 2;
    root.y0 = 0;

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
    const tempTreeData = treemap(root);
    const tempNodes = tempTreeData.descendants();
    const maxDepth = tempNodes.length > 0 ? d3.max(tempNodes, function(d) { return d.depth; }) : 0;
    const requiredWidth = Math.max(width, (maxDepth + 1) * nodeSpacing + margin.right);
    
    // Update treemap size to ensure proper layout calculation
    treemap.size([height, requiredWidth]);
    
    // Assigns the x and y position for the nodes
    const treeData = treemap(root);

    // Compute the new tree layout.
    const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) { d.y = d.depth * nodeSpacing });
    
    // Update SVG width if needed to accommodate the full tree
    const currentSvgWidth = parseFloat(svgElement.attr("width"));
    const newSvgWidth = requiredWidth + margin.left + margin.right;
    if (currentSvgWidth < newSvgWidth) {
        svgElement.attr("width", newSvgWidth);
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

// Handle window resize
window.addEventListener('resize', function() {
    if (root) {
        width = window.innerWidth - margin.left - margin.right;
        height = window.innerHeight - margin.top - margin.bottom;
        treemap.size([height, width]);
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
                const possibleNames = [
                    camelCaseName + 'Data',
                    camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1) + 'Data',
                    varName + 'Data',
                    varName.charAt(0).toUpperCase() + varName.slice(1) + 'Data',
                    // Fallback to common names only if filename-derived names don't match
                    'treeData', 'hikingData', 'relocationData'
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
                    loadTreeData(loadedData);
                } else {
                    alert('Could not find tree data in ' + fileParam);
                    if (typeof treeData !== 'undefined') {
                        loadTreeData(treeData);
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
