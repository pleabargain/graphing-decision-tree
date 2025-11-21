<!-- https://github.com/pleabargain/graphing-decision-tree/tree/interactive -->
# Agent Guide

This document outlines best practices and conventions for AI agents working on the `graphing-decision-tree` repository.

## Project Overview
This project is a D3.js-based interactive decision tree viewer. It dynamically loads decision tree data from JavaScript files.

## interacting with user
Ask one question at a time.
Format questions with a) b) c) answers

## Code Style
-   **Language**: JavaScript (ES6+).
-   **Formatting**: Use consistent indentation (4 spaces) and semi-colons.
-   **D3.js**: Use D3.js v7 patterns (e.g., `d3.select`, `join` pattern).

## logs
every time the app is run the logs should be updated with ISO timestamped verbose entry

## bugs
If bugs are discovered, then create unit tests to isolate the bug.

## unit tests
If a function is not working, create a unit test to isolate what in fact is broken.

### Unit Testing Requirements

1. **Comprehensive Coverage**: 
   - For every feature that involves multiple files or data structures (e.g., links between decision tree files), create comprehensive unit tests that:
     - Test all instances of the feature across all relevant files
     - Include the source file name and target file name in test descriptions
     - Verify that linked resources exist and are accessible
     - Test edge cases and error conditions

2. **Test Naming and Documentation**:
   - Test names should clearly indicate what is being tested
   - Include file names in test descriptions when testing file-specific functionality
   - Format: `"Link from {sourceFile} to {targetFile} - {what is being tested}"`
   - Example: `"Link from dinner_decision_data.js to food-shopping.js - target file exists"`

3. **Logging in Tests**:
   - All unit tests must log their execution to `app.log` with ISO timestamped entries
   - Use the logging function pattern: `log('[timestamp] Test message')`
   - Log test start, test completion, and any important findings
   - Log warnings for potential issues (e.g., files not exposing variables to window)
   - Log summary statistics after test suites complete

4. **Test Structure**:
   - Use `beforeAll` to set up test data and scan files
   - Use `afterAll` to log summary statistics
   - Group related tests using `describe` blocks
   - Each test should be independent and not rely on execution order

5. **Testing Links**:
   - When testing links in decision tree files:
     - Extract all links from all relevant files
     - Test that each linked file exists
     - Test that each linked file is readable
     - Test that each linked file has valid structure
     - Test that each linked file exposes data correctly (e.g., to `window` object)
     - Test for circular dependencies
   - Include both source file name and target file name in test output

6. **Error Handling**:
   - Tests should handle missing files gracefully
   - Log errors but don't fail silently
   - Provide clear error messages indicating which file and link caused the issue


## Data Structure
Decision trees are defined as JavaScript objects in `.js` files.

### Node Format
Each node is an object with:
-   `name` (String): The text to display on the node.
-   `children` (Array): An array of child node objects.
-   `link` (String|Object): Optional. Links to another decision tree.

### Link Format
-   **Simple String**: `"filename.js"` (opens in same window).
-   **Object**: `{ file: "filename.js", newWindow: true }` (opens in new window).

### Example
```javascript
const treeData = {
    name: "Root",
    children: [
        { name: "Child 1", children: [] },
        { name: "Child 2", link: "other.js" }
    ]
};
```

## File Structure
-   **Root**: Contains `decision_tree.html` and core logic.
-   **Data Files**: All `*_decision_data.js` or `*.js` files containing tree data reside in the root for simplicity.

## Git Conventions
-   **Commits**: Use Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).
