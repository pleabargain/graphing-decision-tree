// File: buy-phone.js

const buyPhoneData = {
    name: "Buy a New Phone?",
    children: [
        {
            name: "Can Afford Without Sacrificing?",
            children: [
                {
                    name: "Current Phone Status",
                    children: [
                        {
                            name: "Still Working",
                            children: [
                                {
                                    name: "Minor Issues",
                                    children: [{ name: "Consider Repair – Delay Purchase" }]
                                },
                                {
                                    name: "Major Issues (Battery, Screen, etc.)",
                                    children: [
                                        {
                                            name: "Repair Cost vs. New Phone Price",
                                            children: [
                                                {
                                                    name: "Repair > 50% of New Phone Price",
                                                    children: [{ name: "Buy New Phone – Repair Not Worth It" }]
                                                },
                                                {
                                                    name: "Repair ≤ 50% of New Phone Price",
                                                    children: [
                                                        {
                                                            name: "Value of New Features",
                                                            children: [
                                                                {
                                                                    name: "Essential (Camera, OS updates, security)",
                                                                    children: [{ name: "Buy New Phone – Features Matter" }]
                                                                },
                                                                {
                                                                    name: "Nice‑to‑have (Extra RAM, storage, gaming performance)",
                                                                    children: [
                                                                        {
                                                                            name: "Do You Really Need It?",
                                                                            children: [
                                                                                {
                                                                                    name: "Yes",
                                                                                    children: [{ name: "Buy New Phone – Upgrade Worth It" }]
                                                                                },
                                                                                {
                                                                                    name: "No",
                                                                                    children: [{ name: "Keep Current Phone – Save Money" }]
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "Working Fine",
                            children: [
                                {
                                    name: "New Phone Desire",
                                    children: [
                                        {
                                            name: "Emotional Purchase?",
                                            children: [
                                                {
                                                    name: "Just for the Trend",
                                                    children: [{ name: "Reevaluate – Not a Necessity" }]
                                                },
                                                {
                                                    name: "Improved User Experience",
                                                    children: [
                                                        {
                                                            name: "Root Desire: Convenience",
                                                            children: [
                                                                {
                                                                    name: "Speed",
                                                                    children: [{ name: "Buy New Phone – Faster Processing" }]
                                                                },
                                                                {
                                                                    name: "Battery Life",
                                                                    children: [{ name: "Buy New Phone – Longer Battery" }]
                                                                },
                                                                {
                                                                    name: "Multitasking",
                                                                    children: [{ name: "Buy New Phone – Better Performance" }]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Opportunity Costs",
                    children: [
                        {
                            name: "Where Else Can the Money Go?",
                            children: [
                                {
                                    name: "Computer",
                                    children: [
                                        {
                                            name: "Upgrade Needed?",
                                            children: [
                                                { name: "Yes – Pay for Computer Instead" },
                                                { name: "No – Keep Current Computer" }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Home",
                                    children: [
                                        {
                                            name: "Major Renovations (Roof, HVAC, etc.)",
                                            children: [
                                                { name: "Yes – Prioritize Home Repair" },
                                                { name: "No – Move Funds to Phone" }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Family",
                                    children: [
                                        {
                                            name: "Education / Health / Emergencies",
                                            children: [
                                                { name: "Yes – Allocate to Family First" },
                                                { name: "No – Allocate to Phone" }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Travel",
                                    children: [
                                        {
                                            name: "Upcoming Trip?",
                                            children: [
                                                { name: "Yes – Save for Travel" },
                                                { name: "No – Allocate to Phone" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "Financial Stability",
                            children: [
                                {
                                    name: "Debt Repayment",
                                    children: [
                                        {
                                            name: "High Debt",
                                            children: [{ name: "Prioritize Debt Repayment – Postpone Phone" }]
                                        },
                                        {
                                            name: "Low/No Debt",
                                            children: [{ name: "Consider Phone Purchase" }]
                                        }
                                    ]
                                },
                                {
                                    name: "Savings Goal",
                                    children: [
                                        {
                                            name: "Emergency Fund < 3 Months Expenses",
                                            children: [{ name: "Complete Fund Before Buying Phone" }]
                                        },
                                        {
                                            name: "Emergency Fund ≥ 3 Months Expenses",
                                            children: [{ name: "Phone Purchase Feasible" }]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Budget Allocation",
                    children: [
                        {
                            name: "Monthly Income vs. Expenses",
                            children: [
                                {
                                    name: "Disposable Income > Phone Price",
                                    children: [{ name: "Buy Phone – Within Budget" }]
                                },
                                {
                                    name: "Disposable Income < Phone Price",
                                    children: [
                                        {
                                            name: "Can Save Over Months?",
                                            children: [
                                                { name: "Yes – Plan to Buy After Savings" },
                                                { name: "No – Postpone Purchase" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
