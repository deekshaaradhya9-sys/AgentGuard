def check_intent(user_request, action):

    request = user_request.lower()
    action_name = action["action"]

    # Safe: user explicitly asked for a search
    if "search" in request and action_name == "web_search":
        return {
            "intent_match": True,
            "score": 100,
            "reason": "The agent action matches the user's request."
        }

    # Safe: user explicitly asked to send an email
    if "email" in request and action_name == "send_email":
        return {
            "intent_match": True,
            "score": 100,
            "reason": "The agent action matches the user's request."
        }

    # Dangerous: deleting when user did not request deletion
    if action_name == "delete_file" and "delete" not in request:
        return {
            "intent_match": False,
            "score": 10,
            "reason": "The agent is trying to delete a file, but the user did not request deletion."
        }

    # Unknown action
    return {
        "intent_match": False,
        "score": 20,
        "reason": "The requested action does not clearly match the user's intention."
    }