"""
SupportOps AI - Intent Mapping

Maps fine-grained BANKING77 intents into the broader
operational categories used by the SLA risk model.
"""


def map_intent_to_sla_category(
    banking77_intent: str
) -> str:

    intent = banking77_intent.lower().strip()


    # ========================================================
    # IDENTITY VERIFICATION
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "verify",
            "verification",
            "identity"
        ]
    ):
        return "identity_verification"


    # ========================================================
    # ACCOUNT SECURITY / UNRECOGNISED ACTIVITY
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "not_recognised",
            "not_recognized",
            "compromised",
            "cash_withdrawal_not_recognised"
        ]
    ):
        return "account_security"


    # ========================================================
    # BANK TRANSFERS
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "transfer",
            "beneficiary",
            "recipient"
        ]
    ):
        return "bank_transfer"


    # ========================================================
    # CASH WITHDRAWALS / ATM
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "cash_withdrawal",
            "cash_withdraw",
            "cash withdrawal",
            "cash_machine"
        ]
    ):
        return "cash_withdrawal"


    # ========================================================
    # REFUNDS
    # ========================================================

    if "refund" in intent:
        return "refund"


    # ========================================================
    # CARD PAYMENTS
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "card_payment",
            "cashback",
            "cash_back"
        ]
    ):
        return "card_payment"


    # ========================================================
    # CARD / PIN MANAGEMENT
    # ========================================================

    if any(
        keyword in intent
        for keyword in [
            "pin",
            "card_arrival",
            "card_delivery",
            "card_swallowed",
            "activate_my_card",
            "cash_withdrawal"
        ]
    ):
        return "card_and_pin"


    # ========================================================
    # DEFAULT CATEGORY
    # ========================================================

    return "general_support"