// Decision Tree Data: Dinner Decision
const treeData = {
    name: "Hungry for Dinner?",
    children: [
        {
            name: "Have Ingredients?",
            children: [
                {
                    name: "Yes",
                    children: [
                        {
                            name: "Feel like cooking?",
                            children: [
                                { name: "Yes", children: [{ name: "Cook at Home!" }] },
                                { name: "No", children: [{ name: "Order Takeout" }] }
                            ]
                        }
                    ]
                },
                {
                    name: "No",
                    children: [
                        {
                            name: "Want to go shopping?",
                            children: [
                                { name: "Yes", children: [{ name: "Go to Store -> Cook", link: "food-shopping.js" }] },
                                { name: "No", children: [{ name: "Order Takeout" }] }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "Not really...",
            children: [
                { name: "Have a snack" },
                { 
                    name: "Need help deciding?",
                    // Example: Link to another decision tree (opens in same window)
                    link: "hiking_decision_data.js"
                }
            ]
        }
    ]
};
