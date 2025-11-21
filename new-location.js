// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
/* new-relocation.js ---------------------------------------------------------
 *
 * Decision tree for moving to a new country.  This structure mirrors the
 * format used in `new-career.js` and expands the conversation to cover
 * the major concerns that arise when planning an international relocation.
 * Each node contains a `name` and an optional array of `children` that
 * represent follow‑up questions or actions.  Leaf nodes are usually
 * actionable items or simple decisions (Yes / No, etc.).
 *
 * Feel free to adapt the labels and branching logic to match the
 * specific countries, visa regimes, or personal circumstances you
 * care about.
 */

const relocationData = {
    name: "Considering a Relocation?",
    children: [
        // 1. Motivation for Moving ------------------------------------------------
        {
            name: "What is your primary motivation?",
            children: [
                { name: "Career opportunity", children: [{ name: "Explore job market" }] },
                { name: "Lifestyle change", children: [{ name: "Research lifestyle factors" }] },
                { name: "Family reasons", children: [{ name: "Consider family logistics" }] },
                { name: "Adventure / New culture", children: [{ name: "Prepare cultural readiness" }] }
            ]
        },

        // 2. Visa & Legal Status -----------------------------------------------
        {
            name: "Visa & Legal Considerations",
            children: [
                {
                    name: "Do you have a job offer with sponsorship?",
                    children: [
                        {
                            name: "Yes",
                            children: [
                                { name: "Employer will handle sponsorship", children: [{ name: "Check sponsorship policy" }] },
                                { name: "Employer does not offer sponsorship", children: [{ name: "Explore alternate sponsorship" }] }
                            ]
                        },
                        {
                            name: "No",
                            children: [
                                {
                                    name: "Do you qualify for a self‑sponsored visa?",
                                    children: [
                                        {
                                            name: "Yes (e.g., skilled migrant, entrepreneur)",
                                            children: [
                                                { name: "Gather documentation", children: [{ name: "Prepare portfolio" }] },
                                                { name: "Check points / eligibility", children: [{ name: "Run points calculator" }] }
                                            ]
                                        },
                                        {
                                            name: "No",
                                            children: [
                                                { name: "Consider student visa", children: [{ name: "Find accredited program" }] },
                                                { name: "Consider visitor visa", children: [{ name: "Plan temporary stay" }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Which type of visa are you targeting?",
                    children: [
                        {
                            name: "Work visa",
                            children: [
                                { name: "Check work permit requirements", children: [{ name: "List required documents" }] },
                                { name: "Confirm employment contract complies", children: [{ name: "Review contract clauses" }] }
                            ]
                        },
                        {
                            name: "Student visa",
                            children: [
                                { name: "Confirm admission letter", children: [{ name: "Obtain I-20 / DS-2019" }] },
                                { name: "Show proof of funds", children: [{ name: "Prepare bank statements" }] }
                            ]
                        },
                        {
                            name: "Investor / Entrepreneur visa",
                            children: [
                                { name: "Assess investment threshold", children: [{ name: "Compile investment plan" }] },
                                { name: "Demonstrate business viability", children: [{ name: "Prepare business model" }] }
                            ]
                        }
                    ]
                }
            ]
        },

        // 3. Language Proficiency -----------------------------------------------
        {
            name: "Language Issues",
            children: [
                {
                    name: "Do you speak the local language?",
                    children: [
                        {
                            name: "Yes",
                            children: [
                                { name: "Assess proficiency level", children: [{ name: "Take language test" }] },
                                { name: "Consider advanced certification", children: [{ name: "Research certification programs" }] }
                            ]
                        },
                        {
                            name: "No",
                            children: [
                                { name: "Is language learning required?", children: [{ name: "Check visa requirements" }] },
                                { name: "Start language learning", children: [{ name: "Find language courses" }] }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
