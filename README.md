<!-- https://github.com/pleabargain/graphing-decision-tree/tree/interactive -->
# Graphical Decision Tree

This project implements an interactive decision tree using D3.js. It allows you to load different decision scenarios dynamically.

## How to Use

1.  Open `decision_tree.html` in your web browser.
2.  You will see a "Choose File" button at the top left.
3.  Select a `.js` data file (e.g., `dinner_decision_data.js` or `hiking_decision_data.js`).
4.  The decision tree will render automatically.
5.  Click on nodes to expand or collapse branches.

## Data Files

-   **dinner_decision_data.js**: A simple tree to decide between cooking and ordering takeout.
-   **hiking_decision_data.js**: A more complex tree for deciding on a weekend hike, considering injuries, weather, driving time, and opportunity costs.

## Creating Custom Data

You can create your own decision trees by creating a new `.js` file with the following structure:

```javascript
const myTreeData = {
    name: "Root Node Question?",
    children: [
        {
            name: "Option 1",
            children: [ ... ]
        },
        {
            name: "Option 2",
            children: [ ... ]
        }
    ]
};
```

Ensure the file defines a single object (the variable name doesn't matter as the loader extracts the object).

## Linking to Other Decision Trees

You can add links to nodes that will load and open another decision tree. Nodes with links are displayed with a red circle and a link icon (🔗).

### Simple Link (Same Window)

To link to another decision tree file that opens in the same window:

```javascript
{
    name: "Need more help?",
    link: "hiking_decision_data.js"  // Opens in same window
}
```

### Link in New Window/Tab

To open the linked decision tree in a new browser tab:

```javascript
{
    name: "See related decision",
    link: {
        file: "new-location.js",
        newWindow: true  // Opens in new tab
    }
}
```

When you click on a node with a link, it will load the specified decision tree file. The link can point to any `.js` file in the same directory that follows the decision tree data format.

## URL Parameters

You can also load a specific decision tree file directly by adding a `file` parameter to the URL:

```
decision_tree.html?file=hiking_decision_data.js
```

This is useful for bookmarking specific decision trees or sharing direct links.

## Search Feature

The application includes a fuzzy search feature that allows you to search through all `.js` decision tree files. The search functionality:

- **Fuzzy Matching**: Uses Levenshtein distance algorithm to find matches even with misspellings
- **Searches Both**: Searches both filenames and file contents
- **Real-time Results**: Shows matching files with relevance scores and content snippets
- **Quick Access**: Click on any search result to load that decision tree file

### How to Use Search

1. Look for the "🔍 Search Files" input field in the control panel (top left)
2. Type your search query (e.g., "food", "shopping", "location")
3. Results appear below the search box showing:
   - Filename
   - Match score percentage
   - Content snippets (if found in file contents)
4. Click on any result to load that decision tree file

The search is debounced (300ms delay) to avoid excessive queries while typing. It handles partial matches and typos, making it easy to find files even if you're not sure of the exact filename.

## Tree Title Display

The application displays the name of the currently active decision tree at the top of the page. The title:

- Shows the root node name from the tree data (e.g., "Food Shopping?")
- Falls back to a formatted version of the filename if no root name is available
- Is positioned at the top of the page and does not interfere with viewing or interacting with the decision tree
- Updates automatically when a new tree is loaded

The title bar is fixed at the top of the page and provides a clear visual indicator of which decision tree is currently being viewed.

---

Last Updated: 2025-01-27