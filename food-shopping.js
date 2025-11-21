// Decision Tree Data: Food Shopping
const foodShoppingData = {
    name: "Food Shopping?",
    children: [
        {
            name: "What's your budget?",
            children: [
                {
                    name: "High budget",
                    children: [
                        { name: "Go to Carrefour" }
                    ]
                },
                {
                    name: "Low budget",
                    children: [
                        {
                            name: "How much time do you have?",
                            children: [
                                {
                                    name: "Little time",
                                    children: [
                                        { name: "Go to Viva" }
                                    ]
                                },
                                {
                                    name: "More time",
                                    children: [
                                        { name: "Go to Carrefour" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "Restart decision",
            link: "food-shopping.js"
        }
    ]
};

