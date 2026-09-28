from typing import Any

from backend.services.analysis_service import (
    get_error_counts,
)


QUESTION_BANK = {
    "grammar": [
        {
            "question": "Choose the correct sentence.",
            "options": [
                "She go to college every day.",
                "She goes to college every day.",
                "She going to college every day.",
            ],
            "answer": "She goes to college every day.",
            "explanation": (
                "The singular subject 'She' takes 'goes' "
                "in the simple present."
            ),
        }
    ],

    "spelling": [
        {
            "question": "Choose the correct spelling.",
            "options": [
                "collge",
                "college",
                "colledge",
            ],
            "answer": "college",
            "explanation": (
                "The standard spelling is 'college'."
            ),
        }
    ],

    "tense": [
        {
            "question": "Choose the correct sentence.",
            "options": [
                "I eat dinner yesterday.",
                "I ate dinner yesterday.",
                "I eating dinner yesterday.",
            ],
            "answer": "I ate dinner yesterday.",
            "explanation": (
                "'Yesterday' refers to a completed past action, "
                "so the simple past is appropriate."
            ),
        }
    ],

    "punctuation": [
        {
            "question": "Which punctuation normally ends a statement?",
            "options": [
                ".",
                ",",
                ":",
            ],
            "answer": ".",
            "explanation": (
                "A normal declarative sentence usually ends with a period."
            ),
        }
    ],

    "capitalization": [
        {
            "question": "Which sentence is correctly capitalized?",
            "options": [
                "i am ready.",
                "I am ready.",
                "i Am ready.",
            ],
            "answer": "I am ready.",
            "explanation": (
                "The personal pronoun 'I' is always capitalized."
            ),
        }
    ],
}


def generate_practice(
    mistakes: list[dict[str, Any]],
) -> dict:

    counts = get_error_counts(
        mistakes
    )

    priority = "grammar"

    if mistakes:

        priority = max(
            counts,
            key=counts.get,
        )

        if counts.get(
            priority,
            0,
        ) == 0:

            mistake_type = str(
                mistakes[0].get(
                    "type",
                    "Grammar",
                )
            ).lower()

            if "spelling" in mistake_type:
                priority = "spelling"

            elif "tense" in mistake_type:
                priority = "tense"

            elif "punctuation" in mistake_type:
                priority = "punctuation"

            elif "capitalization" in mistake_type:
                priority = "capitalization"

            else:
                priority = "grammar"

    questions = QUESTION_BANK.get(
        priority,
        QUESTION_BANK["grammar"],
    )

    return {
        "topic": priority.capitalize(),
        "questions": questions,
    }