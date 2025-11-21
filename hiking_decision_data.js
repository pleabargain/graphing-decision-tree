const hikingData = {
    name: "Go Hiking?",
    children: [
        {
            name: "Any Injuries?",
            children: [
                {
                    name: "Yes",
                    children: [{ name: "Stay Home & Recover" }]
                },
                {
                    name: "No",
                    children: [
                        {
                            name: "Check Weather",
                            children: [
                                {
                                    name: "Raining/Stormy",
                                    children: [{ name: "Gym / Indoor Activity" }]
                                },
                                {
                                    name: "Clear/Sunny",
                                    children: [
                                        {
                                            name: "Temp > 25C?",
                                            children: [
                                                { name: "Yes", children: [{ name: "Too Hot! No Hiking" }] },
                                                {
                                                    name: "No",
                                                    children: [
                                                        {
                                                            name: "Driving Time?",
                                                            children: [
                                                                {
                                                                    name: "> 2 Hours",
                                                                    children: [
                                                                        {
                                                                            name: "Worth the drive?",
                                                                            children: [
                                                                                { name: "Yes", children: [{ name: "Go for it!" }] },
                                                                                { name: "No", children: [{ name: "Find Local Trail" }] }
                                                                            ]
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    name: "< 2 Hours",
                                                                    children: [
                                                                        {
                                                                            name: "Opportunity Cost?",
                                                                            children: [
                                                                                {
                                                                                    name: "Work to do",
                                                                                    children: [{ name: "Short Hike (2-3 hrs)" }]
                                                                                },
                                                                                {
                                                                                    name: "Free Day",
                                                                                    children: [{ name: "Long Hike / Summit" }]
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
                        }
                    ]
                }
            ]
        }
    ]
};

// Expose to window for script loading
window.hikingData = hikingData;