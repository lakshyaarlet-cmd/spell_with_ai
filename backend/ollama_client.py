import json
import re
from typing import Any

import ollama


MODEL_NAME = "llama3.2:latest"


SYSTEM_PROMPT = """
You are WriteWise AI, an explainable AI writing assistant.

Your responsibility is to analyze English writing accurately,
conservatively, and contextually.

Detect genuine:

- Grammar errors
- Spelling errors
- Punctuation errors
- Capitalization errors
- Verb tense errors
- Subject-verb agreement errors
- Incorrect word usage
- Sentence structure problems
- Clarity problems
- Unnecessary repetition

IMPORTANT:

1. Preserve the user's intended meaning.
2. Do not rewrite correct text unnecessarily.
3. Do not invent mistakes.
4. Use the entire sentence as context.
5. Consider time expressions when identifying tense.
6. Proper nouns and technical terms should not be changed unless
   there is a genuine error.
7. The "original" field must contain text that actually appears
   in the user's input.
8. The "correction" field must show the actual correction.
9. Every genuine detected error must appear in "mistakes".
10. If the writing is already correct, return an empty mistakes array.

TIME AND TENSE:

- yesterday, last week, last year, ago
  usually indicate completed past actions.

- tomorrow, next week, next year
  usually indicate future actions.

- every day, usually, often, always
  often indicate habitual present actions.

Examples:

Input:
She go to school every day.

Correct:
She goes to school every day.

Input:
I eat dinner yesterday.

Correct:
I ate dinner yesterday.

Input:
He completed the project tomorrow.

Correct:
He will complete the project tomorrow.

Input:
I am studing computer science.

Correct:
I am studying computer science.

Input:
she go to collge yesterday and submit the assigment

Correct:
She went to college yesterday and submitted the assignment.

Do not simply memorize these examples.
Apply the grammar rules contextually.

OUTPUT:

Return ONLY valid JSON.

Use exactly this structure:

{
  "corrected_text": "string",
  "summary": "string",
  "mistakes": [
    {
      "original": "string",
      "correction": "string",
      "type": "Grammar",
      "explanation": "string",
      "rule": "string",
      "example": "string"
    }
  ],
  "suggestions": [
    "string"
  ],
  "rewrite_options": {
    "professional": "string",
    "simple": "string",
    "concise": "string",
    "confident": "string",
    "creative": "string"
  }
}

The "type" should normally be one of:

Grammar
Spelling
Punctuation
Capitalization
Tense
Clarity
Vocabulary

Do not output Markdown.
Do not output code fences.
Do not output anything outside the JSON object.
"""


def _extract_content(response: Any) -> str:

    try:
        return response["message"]["content"].strip()

    except Exception:
        pass

    try:
        return response.message.content.strip()

    except Exception:
        pass

    raise ValueError(
        "Could not read content from Ollama response."
    )


def _parse_json(content: str) -> dict:

    try:
        return json.loads(content)

    except json.JSONDecodeError:
        match = re.search(
            r"\{.*\}",
            content,
            re.DOTALL,
        )

        if not match:
            raise ValueError(
                "Ollama returned invalid JSON."
            )

        return json.loads(
            match.group(0)
        )


def analyze_with_ollama(
    text: str,
    mode: str = "General",
) -> dict:

    user_prompt = f"""
Analyze this writing.

Writing mode:
{mode}

Original text:
{text}

Identify every genuine error and explain each one.

Be especially careful with:
- tense
- subject-verb agreement
- spelling
- capitalization
- punctuation
- word choice
- sentence context

Do not invent errors.

Return ONLY valid JSON.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        format="json",
        options={
            "temperature": 0.1,
            "num_predict": 3500,
        },
    )

    content = _extract_content(
        response
    )

    return _parse_json(
        content
    )


def ollama_health() -> dict:

    try:
        response = ollama.list()

        names = []

        if isinstance(response, dict):
            models = response.get(
                "models",
                [],
            )

            for model in models:
                if isinstance(model, dict):
                    name = model.get("name")
                    if name:
                        names.append(name)

                else:
                    name = getattr(
                        model,
                        "name",
                        None,
                    )

                    if name:
                        names.append(name)

        else:
            models = getattr(
                response,
                "models",
                [],
            )

            for model in models:
                name = getattr(
                    model,
                    "model",
                    None,
                )

                if not name:
                    name = getattr(
                        model,
                        "name",
                        None,
                    )

                if name:
                    names.append(name)

        return {
            "online": True,
            "model": MODEL_NAME,
            "installed_models": names,
        }

    except Exception as error:

        return {
            "online": False,
            "model": MODEL_NAME,
            "installed_models": [],
            "error": str(error),
        }