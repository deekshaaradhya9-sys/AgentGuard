TOOLS = {
    "web_search": {
        "base_risk": 10
    },

    "read_file": {
        "base_risk": 25
    },

    "send_email": {
        "base_risk": 45
    },

    "upload_file": {
        "base_risk": 65
    },

    "delete_file": {
        "base_risk": 85
    },

    "make_payment": {
        "base_risk": 95
    }
}


def evaluate_action(action, intent_result):

    action_name = action["action"]
    parameters = action.get("parameters", {})

    # -------------------------------------------------
    # 1. CHECK WHETHER TOOL EXISTS
    # -------------------------------------------------

    if action_name not in TOOLS:
        return {
            "decision": "BLOCK",
            "risk_score": 100,
            "risk_level": "CRITICAL",
            "permission": "DENIED",
            "factors": [
                "Unknown or unauthorized tool"
            ],
            "reason": "This tool is not authorized."
        }

    tool_risk = TOOLS[action_name]["base_risk"]

    risk = tool_risk

    factors = [
        f"Tool risk: {tool_risk}"
    ]


    # -------------------------------------------------
    # 2. PERMISSION FIREWALL
    # -------------------------------------------------

    # Actions that can happen automatically
    auto_allowed = [
        "web_search",
        "read_file"
    ]

    # Actions that require the human to approve
    approval_required = [
        "send_email"
    ]

    # Actions that are never allowed automatically
    blocked_actions = [
        "delete_file",
        "make_payment"
    ]


    if action_name in auto_allowed:

        permission = "AUTHORIZED"

        factors.append(
            "Action is authorized for autonomous execution"
        )


    elif action_name in approval_required:

        permission = "HUMAN_APPROVAL"

        factors.append(
            "Action requires human authorization"
        )


    elif action_name in blocked_actions:

        permission = "DENIED"

        risk += 15

        factors.append(
            "Action is not authorized for autonomous execution"
        )


    else:

        permission = "DENIED"

        risk += 20

        factors.append(
            "Action does not have an approved permission policy"
        )


    # -------------------------------------------------
    # 3. INTENT CHECK
    # -------------------------------------------------

    if not intent_result["intent_match"]:

        risk += 25

        factors.append(
            "User intent does not match agent action"
        )


    # -------------------------------------------------
    # 4. SENSITIVE DATA CHECK
    # -------------------------------------------------

    text = str(parameters).lower()

    sensitive_keywords = [
        "password",
        "bank",
        "card",
        "financial",
        "aadhaar",
        "identity",
        "id card",
        "resume",
        "personal",
        "private"
    ]

    sensitive_found = any(
        word in text
        for word in sensitive_keywords
    )


    if sensitive_found:

        risk += 20

        factors.append(
            "Sensitive information involved"
        )


    # -------------------------------------------------
    # 5. DESTINATION CHECK
    # -------------------------------------------------

    destination = str(
        parameters.get("destination", "")
    ).lower()


    if destination:

        trusted_domains = [
            "google.com",
            "github.com",
            "microsoft.com"
        ]

        trusted = any(
            domain in destination
            for domain in trusted_domains
        )


        if not trusted:

            risk += 20

            factors.append(
                "Unknown or untrusted destination"
            )


    # -------------------------------------------------
    # 6. LIMIT RISK TO 100
    # -------------------------------------------------

    risk = min(risk, 100)


    # -------------------------------------------------
    # 7. FINAL SECURITY DECISION
    # -------------------------------------------------

    if permission == "DENIED":

        decision = "BLOCK"

        level = "CRITICAL"

        reason = (
            "The action is not authorized for autonomous execution."
        )


    elif permission == "HUMAN_APPROVAL":

        decision = "REQUIRE_APPROVAL"

        level = "HIGH"

        reason = (
            "Human authorization is required before this action."
        )


    elif risk < 30:

        decision = "ALLOW"

        level = "LOW"

        reason = (
            "Action is authorized and appears safe."
        )


    elif risk < 60:

        decision = "REQUIRE_APPROVAL"

        level = "MEDIUM"

        reason = (
            "User approval is required."
        )


    elif risk < 80:

        decision = "REQUIRE_APPROVAL"

        level = "HIGH"

        reason = (
            "Action has significant security risk."
        )


    else:

        decision = "BLOCK"

        level = "CRITICAL"

        reason = (
            "Action is too risky to execute automatically."
        )
# ---------------------------------------------
    # 8. ADAPTIVE AGENT TRUST
    # ---------------------------------------------

    # Trust decreases as security risk increases.
    agent_trust = max(0, 100 - risk)

    if agent_trust >= 80:
        trust_level = "TRUSTED"

    elif agent_trust >= 50:
        trust_level = "CAUTION"

    elif agent_trust >= 25:
        trust_level = "LOW TRUST"

    else:
        trust_level = "UNTRUSTED"


    # ---------------------------------------------
    # 9. RETURN SECURITY DECISION
    # ---------------------------------------------

    return {
        "decision": decision,
        "risk_score": risk,
        "risk_level": level,
        "permission": permission,
        "agent_trust": agent_trust,
        "trust_level": trust_level,
        "factors": factors,
        "reason": reason
    }