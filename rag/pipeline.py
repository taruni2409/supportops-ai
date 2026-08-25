"""
SupportOps AI - RAG Pipeline

Provides semantic retrieval and grounded Gemini generation
for synthetic NovaBank support policies.
"""

import os
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer

import time

from google.genai.errors import ServerError

# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

CHROMA_PATH = PROJECT_ROOT / "rag" / "chroma_db"

ENV_PATH = PROJECT_ROOT / ".env"


# ============================================================
# CONFIGURATION
# ============================================================

COLLECTION_NAME = "novabank_support_policies"

EMBEDDING_MODEL_NAME = (
    "sentence-transformers/all-MiniLM-L6-v2"
)

LLM_MODEL = "gemini-3.5-flash-lite"

RETRIEVAL_THRESHOLD = 0.45

FALLBACK_MESSAGE = (
    "The available policy context does not "
    "provide enough information."
)


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv(ENV_PATH)

gemini_api_key = os.getenv(
    "GEMINI_API_KEY"
)

if not gemini_api_key:
    raise ValueError(
        "GEMINI_API_KEY was not found."
    )


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL_NAME,
    device="cpu"
)

# ============================================================
# LOAD CHROMADB
# ============================================================

chroma_client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

collection = chroma_client.get_collection(
    name=COLLECTION_NAME
)


# ============================================================
# GEMINI CLIENT
# ============================================================

gemini_client = genai.Client(
    api_key=gemini_api_key,
    http_options=types.HttpOptions(
        timeout=90000
    )
)


# ============================================================
# RETRIEVAL
# ============================================================

def retrieve_context(
    query,
    top_k=3
):

    query_embedding = embedding_model.encode(
        query,
        normalize_embeddings=True
    )

    results = collection.query(
        query_embeddings=[
            query_embedding.tolist()
        ],
        n_results=top_k
    )

    retrieved_chunks = []

    for i in range(
        len(results["documents"][0])
    ):

        distance = float(
            results["distances"][0][i]
        )

        similarity = 1 - distance

        retrieved_chunks.append({
            "rank":
                i + 1,

            "source":
                results["metadatas"][0][i][
                    "source"
                ],

            "chunk_id":
                results["metadatas"][0][i][
                    "chunk_id"
                ],

            "text":
                results["documents"][0][i],

            "distance":
                round(distance, 4),

            "similarity":
                round(similarity, 4)
        })

    return retrieved_chunks


# ============================================================
# CONTEXT FORMATTING
# ============================================================

def format_retrieved_context(
    retrieved
):

    context_blocks = []

    for index, item in enumerate(
        retrieved,
        start=1
    ):

        block = (
            f"[Source {index}: "
            f"{item['source']} | "
            f"{item['chunk_id']}]\n"
            f"{item['text']}"
        )

        context_blocks.append(
            block
        )

    return "\n\n---\n\n".join(
        context_blocks
    )


# ============================================================
# PROMPT ENGINEERING
# ============================================================

def build_rag_prompt(
    question,
    context
):

    prompt = f"""
You are SupportOps AI, an internal customer-support
assistant for NovaBank.

Answer the support question using ONLY the NovaBank
policy information provided below.

GROUNDING RULES

1. Use only information contained in the retrieved policy context.
2. Do not invent policies, timelines, fees, requirements, or procedures.
3. If the context does not contain enough information, say:
   "{FALLBACK_MESSAGE}"
4. Give clear and actionable support steps.
5. Mention timelines only when explicitly stated.
6. Cite evidence using [Source 1], [Source 2], etc.
7. Do not cite a source unless it supports the statement.
8. Do not claim an action has already occurred.
9. Keep the response concise and professional.

RETRIEVED NOVABANK POLICY CONTEXT
---------------------------------
{context}

SUPPORT QUESTION
----------------
{question}

GROUNDED SUPPORT RECOMMENDATION
-------------------------------
"""

    return prompt.strip()


# ============================================================
# GENERATION
# ============================================================

def generate_grounded_answer(
    question,
    context,
    max_retries=3
):

    prompt = build_rag_prompt(
        question,
        context
    )

    for attempt in range(
        1,
        max_retries + 1
    ):

        try:

            response = (
                gemini_client.models.generate_content(
                    model=LLM_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        thinking_config=
                            types.ThinkingConfig(
                                thinking_level="minimal"
                            ),
                        max_output_tokens=500
                    )
                )
            )

            return response.text

        except ServerError as exc:

            print(
                f"Gemini attempt "
                f"{attempt}/{max_retries} failed: "
                f"{exc}"
            )

            if attempt == max_retries:
                raise

            time.sleep(
                2 ** attempt
            )

# ============================================================
# FALLBACK DETECTION
# ============================================================

def is_insufficient_context_answer(
    answer
):

    return (
        FALLBACK_MESSAGE.lower()
        in answer.lower()
    )


# ============================================================
# COMPLETE RAG PIPELINE
# ============================================================

def answer_with_rag(
    question,
    top_k=3,
    threshold=RETRIEVAL_THRESHOLD
):

    # Retrieve relevant policy chunks
    retrieved = retrieve_context(
        question,
        top_k=top_k
    )

    if not retrieved:

        return {
            "question":
                question,

            "answer":
                FALLBACK_MESSAGE,

            "sources":
                [],

            "top_similarity":
                0.0,

            "status":
                "no_retrieval"
        }

    top_similarity = (
        retrieved[0]["similarity"]
    )

    # Reject clearly unrelated requests
    if top_similarity < threshold:

        return {
            "question":
                question,

            "answer":
                FALLBACK_MESSAGE,

            "sources":
                retrieved,

            "top_similarity":
                top_similarity,

            "status":
                "low_retrieval_confidence"
        }

    # Construct grounded context
    context = format_retrieved_context(
        retrieved
    )

    try:
        answer = generate_grounded_answer(
            question,
            context
        )

    except ServerError:
        return {
        "question":
            question,

        "answer":
            (
                "The support recommendation service "
                "is temporarily unavailable. "
                "Please try again shortly."
            ),

        "sources":
            retrieved,

        "top_similarity":
            top_similarity,

        "status":
            "generation_unavailable"
        }

    # Determine whether KB contained
    # enough information
    if is_insufficient_context_answer(
        answer
    ):
        status = "insufficient_context"

    else:
        status = "answered"

    return {
        "question":
            question,

        "answer":
            answer,

        "sources":
            retrieved,

        "top_similarity":
            top_similarity,

        "status":
            status
    }