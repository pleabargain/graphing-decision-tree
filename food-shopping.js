// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
window.treeData = {
    "name": "Food Shopping?",
    "children": [
        {
            "name": "What's your budget?",
            "children": [
                {
                    "name": "High budget over 50AED",
                    "children": [
                        {
                            "name": "Go to Carrefour"
                        }
                    ]
                },
                {
                    "name": "Low budget",
                    "children": [
                        {
                            "name": "How much time do you have?",
                            "children": [
                                {
                                    "name": "Little time",
                                    "children": [
                                        {
                                            "name": "Go to Viva"
                                        }
                                    ]
                                },
                                {
                                    "name": "More time",
                                    "children": [
                                        {
                                            "name": "Go to Carrefour"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "New Node"
                },
                {
                    "name": "New Node"
                }
            ]
        },
        {
            "name": "Restart decision",
            "link": "food-shopping.js"
        }
    ]
};