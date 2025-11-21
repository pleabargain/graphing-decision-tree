// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
window.treeData = {
    "name": "Critical Family Needs Assessment",
    "children": [
        {
            "name": "Health",
            "children": [
                {
                    "name": "Medical Care Access",
                    "children": [
                        {
                            "name": "Adequate - Family has access to needed medical care"
                        },
                        {
                            "name": "Inadequate - Need to improve medical access"
                        }
                    ]
                },
                {
                    "name": "Preventive Care",
                    "children": [
                        {
                            "name": "Regular checkups and screenings available"
                        },
                        {
                            "name": "Need better preventive care options"
                        }
                    ]
                },
                {
                    "name": "Mental Health Support",
                    "children": [
                        {
                            "name": "Adequate mental health resources available"
                        },
                        {
                            "name": "Need better mental health support"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Savings",
            "children": [
                {
                    "name": "Emergency Fund",
                    "children": [
                        {
                            "name": "Adequate emergency savings (3-6 months expenses)"
                        },
                        {
                            "name": "Insufficient emergency savings - prioritize building fund"
                        }
                    ]
                },
                {
                    "name": "Long-term Savings",
                    "children": [
                        {
                            "name": "Retirement savings on track"
                        },
                        {
                            "name": "Need to increase retirement savings"
                        }
                    ]
                },
                {
                    "name": "Education Savings",
                    "children": [
                        {
                            "name": "Education fund established for children"
                        },
                        {
                            "name": "Need to start education savings plan"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Quality of Life",
            "children": [
                {
                    "name": "Work-Life Balance",
                    "children": [
                        {
                            "name": "Adequate time for family and personal needs"
                        },
                        {
                            "name": "Need better work-life balance"
                        }
                    ]
                },
                {
                    "name": "Housing Quality",
                    "children": [
                        {
                            "name": "Safe, adequate, and comfortable housing"
                        },
                        {
                            "name": "Housing needs improvement"
                        }
                    ]
                },
                {
                    "name": "Family Relationships",
                    "children": [
                        {
                            "name": "Strong family bonds and communication"
                        },
                        {
                            "name": "Need to strengthen family relationships"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Access to Education",
            "children": [
                {
                    "name": "K-12 Education",
                    "children": [
                        {
                            "name": "Quality schools accessible to children"
                        },
                        {
                            "name": "Need better educational options"
                        }
                    ]
                },
                {
                    "name": "Higher Education",
                    "children": [
                        {
                            "name": "Pathways to higher education available"
                        },
                        {
                            "name": "Barriers to higher education access"
                        }
                    ]
                },
                {
                    "name": "Adult Education & Training",
                    "children": [
                        {
                            "name": "Access to skill development and training"
                        },
                        {
                            "name": "Need better adult education opportunities"
                        }
                    ]
                },
                {
                    "name": "Educational Resources",
                    "children": [
                        {
                            "name": "Access to libraries, technology, and learning materials"
                        },
                        {
                            "name": "Limited educational resources available"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Free of Fear",
            "children": [
                {
                    "name": "Physical Safety",
                    "children": [
                        {
                            "name": "Family feels physically safe in home and community"
                        },
                        {
                            "name": "Safety concerns present - need to address"
                        }
                    ]
                },
                {
                    "name": "Emotional Safety",
                    "children": [
                        {
                            "name": "Safe emotional environment free from abuse or intimidation"
                        },
                        {
                            "name": "Emotional safety concerns - seek support"
                        }
                    ]
                },
                {
                    "name": "Financial Security",
                    "children": [
                        {
                            "name": "Confident about financial stability"
                        },
                        {
                            "name": "Financial anxiety present - need stability plan"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Free of Danger",
            "children": [
                {
                    "name": "Environmental Safety",
                    "children": [
                        {
                            "name": "Safe living environment (air quality, water, toxins)"
                        },
                        {
                            "name": "Environmental hazards present"
                        }
                    ]
                },
                {
                    "name": "Neighborhood Safety",
                    "children": [
                        {
                            "name": "Safe neighborhood with low crime rates"
                        },
                        {
                            "name": "Safety concerns in neighborhood"
                        }
                    ]
                },
                {
                    "name": "Workplace Safety",
                    "children": [
                        {
                            "name": "Safe working conditions"
                        },
                        {
                            "name": "Workplace safety concerns"
                        }
                    ]
                },
                {
                    "name": "Transportation Safety",
                    "children": [
                        {
                            "name": "Safe transportation options available"
                        },
                        {
                            "name": "Transportation safety concerns"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Access to Healthy Lifestyle Options",
            "children": [
                {
                    "name": "Nutrition",
                    "children": [
                        {
                            "name": "Access to affordable, healthy food"
                        },
                        {
                            "name": "Limited access to healthy food options"
                        }
                    ]
                },
                {
                    "name": "Physical Activity",
                    "children": [
                        {
                            "name": "Access to parks, recreation facilities, and exercise options"
                        },
                        {
                            "name": "Limited opportunities for physical activity"
                        }
                    ]
                },
                {
                    "name": "Outdoor Spaces",
                    "children": [
                        {
                            "name": "Access to safe outdoor spaces for recreation"
                        },
                        {
                            "name": "Limited access to outdoor spaces"
                        }
                    ]
                },
                {
                    "name": "Wellness Programs",
                    "children": [
                        {
                            "name": "Access to wellness and fitness programs"
                        },
                        {
                            "name": "Need better wellness program access"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Access to Arts",
            "children": [
                {
                    "name": "Arts Education",
                    "children": [
                        {
                            "name": "Arts programs available in schools and community"
                        },
                        {
                            "name": "Limited arts education opportunities"
                        }
                    ]
                },
                {
                    "name": "Cultural Events",
                    "children": [
                        {
                            "name": "Access to museums, concerts, theater, and cultural events"
                        },
                        {
                            "name": "Limited access to cultural events"
                        }
                    ]
                },
                {
                    "name": "Creative Expression",
                    "children": [
                        {
                            "name": "Opportunities for family members to pursue creative interests"
                        },
                        {
                            "name": "Need more creative expression opportunities"
                        }
                    ]
                },
                {
                    "name": "Arts Funding & Support",
                    "children": [
                        {
                            "name": "Adequate resources to support arts participation"
                        },
                        {
                            "name": "Financial barriers to arts participation"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Access to Services",
            "children": [
                {
                    "name": "Government Services",
                    "children": [
                        {
                            "name": "Access to needed government services and benefits"
                        },
                        {
                            "name": "Barriers to accessing government services"
                        }
                    ]
                },
                {
                    "name": "Social Services",
                    "children": [
                        {
                            "name": "Access to social services and support programs"
                        },
                        {
                            "name": "Need better access to social services"
                        }
                    ]
                },
                {
                    "name": "Childcare Services",
                    "children": [
                        {
                            "name": "Access to quality, affordable childcare"
                        },
                        {
                            "name": "Childcare access challenges"
                        }
                    ]
                },
                {
                    "name": "Elder Care Services",
                    "children": [
                        {
                            "name": "Access to elder care services when needed"
                        },
                        {
                            "name": "Elder care service gaps"
                        }
                    ]
                },
                {
                    "name": "Legal Services",
                    "children": [
                        {
                            "name": "Access to legal assistance when needed"
                        },
                        {
                            "name": "Barriers to legal services"
                        }
                    ]
                },
                {
                    "name": "Technology & Internet",
                    "children": [
                        {
                            "name": "Access to reliable internet and technology"
                        },
                        {
                            "name": "Digital divide concerns"
                        }
                    ]
                }
            ]
        }
    ]
};
