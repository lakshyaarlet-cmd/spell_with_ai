from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import WritingHistory
from backend.ollama_client import analyze_with_ollama
from backend.services.analysis_service import (
    build_analysis_result,
    build_fallback_result,
)


router = APIRouter(
    tags=["Analysis"],
)


class AnalyzeRequest(BaseModel):

    text: str = Field(
        min_length=1,
        max_length=5000,
    )

    mode: str = Field(
        default="General",
        max_length=50,
    )

    user_id: int = Field(
        default=1,
        ge=1,
    )


def perform_analysis(
    request: AnalyzeRequest,
    db: Session,
):

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Please enter some text to analyze.",
        )

    try:

        raw_result = analyze_with_ollama(
            text=text,
            mode=request.mode,
        )

        analysis = build_analysis_result(
            original_text=text,
            raw_result=raw_result,
            ai_available=True,
        )

    except Exception as error:

        print(
            f"Ollama analysis error: {error}"
        )

        analysis = build_fallback_result(
            text
        )

    history = WritingHistory(
        user_id=request.user_id,
        original_text=text,
        corrected_text=analysis[
            "corrected_text"
        ],
        mode=request.mode,
        score=analysis["score"],
        grammar=analysis["grammar"],
        spelling=analysis["spelling"],
        punctuation=analysis[
            "punctuation"
        ],
        clarity=analysis["clarity"],
        vocabulary=analysis[
            "vocabulary"
        ],
        mistake_count=len(
            analysis["mistakes"]
        ),
    )

    db.add(history)
    db.commit()

    analysis["history_id"] = history.id

    return {
        "success": True,
        "analysis": analysis,
    }


@router.post("/analyze")
def analyze_compatibility(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):

    return perform_analysis(
        request,
        db,
    )


@router.post("/analysis")
def analyze_modular(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):

    return perform_analysis(
        request,
        db,
    )