"""
SupportOps AI - SLA Breach Risk Prediction

Loads the trained XGBoost SLA model and provides
reusable breach-risk scoring for application/API use.
"""

from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "artifacts"
    / "sla_risk_xgboost.joblib"
)


# ============================================================
# LOAD MODEL ARTIFACT
# ============================================================

artifact = joblib.load(
    MODEL_PATH
)

model = artifact["model"]
threshold = artifact["threshold"]
feature_columns = artifact["feature_columns"]


# ============================================================
# SLA RISK PREDICTION
# ============================================================

def predict_sla_risk(ticket):
    """
    Predict SLA breach probability for one support ticket.

    Parameters
    ----------
    ticket : dict
        Ticket features available at intake time.

    Returns
    -------
    dict
        SLA breach probability, risk percentage,
        alert decision and operational threshold.
    """

    ticket_df = pd.DataFrame(
        [ticket]
    )

    # Preserve model feature order
    ticket_df = ticket_df[
        feature_columns
    ]

    probability = (
        model.predict_proba(
            ticket_df
        )[0, 1]
    )

    breach_alert = (
        probability >= threshold
    )

    return {
        "sla_breach_probability":
            round(
                float(probability),
                4
            ),

        "sla_breach_percentage":
            round(
                float(probability) * 100,
                2
            ),

        "breach_alert":
            bool(breach_alert),

        "decision_threshold":
            float(threshold)
    }