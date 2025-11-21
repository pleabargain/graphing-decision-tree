// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
const newCareerData = {
    name: "Considering a Career Change?",
    children: [
        {
            name: "Current Job Satisfaction?",
            children: [
                {
                    name: "Very Satisfied",
                    children: [
                        {
                            name: "Why consider change?",
                            children: [
                                {
                                    name: "Better opportunity",
                                    children: [
                                        {
                                            name: "Financial gain worth risk?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Explore New Career" }] },
                                                { name: "No", children: [{ name: "Stay in Current Role" }] }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Personal growth",
                                    children: [
                                        {
                                            name: "Can grow in current role?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Discuss Growth Plan with Manager" }] },
                                                { name: "No", children: [{ name: "Research New Career Paths" }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Neutral/Unsure",
                    children: [
                        {
                            name: "Financial Stability?",
                            children: [
                                {
                                    name: "Stable",
                                    children: [
                                        {
                                            name: "Skills transferable?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Start Exploring Options" }] },
                                                {
                                                    name: "No",
                                                    children: [
                                                        {
                                                            name: "Willing to retrain?",
                                                            children: [
                                                                { name: "Yes", children: [{ name: "Research Training Programs" }] },
                                                                { name: "No", children: [{ name: "Stay & Improve Current Role" }] }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Unstable",
                                    children: [
                                        {
                                            name: "Can find similar role?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Apply to Similar Roles First" }] },
                                                { name: "No", children: [{ name: "Consider Career Change" }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Dissatisfied",
                    children: [
                        {
                            name: "Root Cause?",
                            children: [
                                {
                                    name: "Company/Culture",
                                    children: [
                                        {
                                            name: "Same role, different company?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Job Search - Same Field" }] },
                                                { name: "No", children: [{ name: "Consider Career Change" }] }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Role/Field",
                                    children: [
                                        {
                                            name: "Financial cushion?",
                                            children: [
                                                {
                                                    name: "Yes (6+ months)",
                                                    children: [
                                                        {
                                                            name: "Clear new direction?",
                                                            children: [
                                                                { name: "Yes", children: [{ name: "Plan Transition & Start Training" }] },
                                                                { name: "No", children: [{ name: "Take Career Assessment & Research" }] }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    name: "No (< 6 months)",
                                                    children: [
                                                        {
                                                            name: "Can transition gradually?",
                                                            children: [
                                                                { name: "Yes", children: [{ name: "Part-time Study / Side Projects" }] },
                                                                { name: "No", children: [{ name: "Build Savings First" }] }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "Work-Life Balance",
                                    children: [
                                        {
                                            name: "Can negotiate current role?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Discuss with Manager" }] },
                                                {
                                                    name: "No",
                                                    children: [
                                                        {
                                                            name: "Field allows flexibility?",
                                                            children: [
                                                                { name: "Yes", children: [{ name: "Look for Flexible Roles" }] },
                                                                { name: "No", children: [{ name: "Consider Career Change" }] }
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
        }
    ]
};

