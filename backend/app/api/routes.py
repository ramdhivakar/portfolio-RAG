from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from groq import APIConnectionError, APIStatusError, RateLimitError
from app.knowledge.knowledge_service import load_knowledge

from app.services.groq_service import generate_response

router = APIRouter(prefix="/api/v1", tags=["AI"])

@router.get("/profile")
def get_public_profile():
    """Return approved portfolio knowledge for the public frontend."""
    return load_knowledge()

class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=4000,
        description="Message sent to the portfolio assistant",
    )


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        answer = await generate_response(request.message)
        return ChatResponse(answer=answer)

    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="The AI service rate limit was reached. Try again later.",
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to the AI service.",
        )

    except APIStatusError:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Check the model configuration.",
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating the response.",
        )