"""
SupportOps AI - Intent Classification

Loads the fine-tuned BANKING77 DistilBERT model and provides
reusable ticket-intent prediction for API/application use.
"""

from pathlib import Path

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
)


# ============================================================
# PATHS / CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "banking77_distilbert_final"
)

BASE_MODEL_NAME = "distilbert-base-uncased"

MAX_LENGTH = 64


# ============================================================
# DEVICE
# ============================================================

# CPU is used for API serving on macOS to keep
# PyTorch/Transformers stable alongside XGBoost.
DEVICE = torch.device("cpu")

torch.set_num_threads(1)

print(f"Intent classifier device: {DEVICE}")

# ============================================================
# LOAD TOKENIZER
# ============================================================

try:
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_PATH
    )

except Exception:
    # Fallback if tokenizer files were not saved locally
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL_NAME
    )


# ============================================================
# LOAD MODEL
# ============================================================

model = (
    AutoModelForSequenceClassification
    .from_pretrained(
        MODEL_PATH
    )
)

model = model.to(DEVICE)

model.eval()


# ============================================================
# PREDICTION
# ============================================================

def predict_intent(
    text,
    top_k=3
):
    """
    Predict the BANKING77 intent for one support message.
    """

    if not isinstance(text, str):
        raise TypeError(
            "Ticket text must be a string."
        )

    text = text.strip()

    if not text:
        raise ValueError(
            "Ticket text cannot be empty."
        )

    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=MAX_LENGTH
    )

    encoded = {
        key: value.to(DEVICE)
        for key, value
        in encoded.items()
    }

    with torch.no_grad():

        outputs = model(
            **encoded
        )

        probabilities = torch.softmax(
            outputs.logits,
            dim=-1
        )[0]

    top_k = min(
        top_k,
        len(probabilities)
    )

    top_probabilities, top_indices = (
        torch.topk(
            probabilities,
            k=top_k
        )
    )

    predictions = []

    for probability, class_id in zip(
        top_probabilities,
        top_indices
    ):

        class_id = int(
            class_id.item()
        )

        probability = float(
            probability.item()
        )

        intent_name = (
            model.config.id2label[
                class_id
            ]
        )

        predictions.append({
            "intent":
                intent_name,

            "confidence":
                round(
                    probability,
                    4
                ),

            "confidence_percentage":
                round(
                    probability * 100,
                    2
                )
        })

    best_prediction = predictions[0]

    return {
        "intent":
            best_prediction["intent"],

        "confidence":
            best_prediction["confidence"],

        "confidence_percentage":
            best_prediction[
                "confidence_percentage"
            ],

        "top_predictions":
            predictions
    }