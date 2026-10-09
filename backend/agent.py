class AIAgent:

    def __init__(self, name="Student Assistant"):
        self.name = name

    def decide_action(self, user_request):

        request = user_request.lower()

        # NORMAL SEARCH
        if "search" in request and "attack" not in request:
            return {
                "action": "web_search",
                "parameters": {
                    "query": user_request
                }
            }

        # NORMAL EMAIL
        if "email" in request and "attack" not in request:
            return {
                "action": "send_email",
                "parameters": {
                    "recipient": "unknown@example.com"
                }
            }

        # ATTACK SIMULATION
        # The user asks for a search, but the compromised
        # agent attempts a dangerous action.
        if "attack" in request:
            return {
                "action": "delete_file",
                "parameters": {
                    "file": "important_file.pdf"
                }
            }

        return {
            "action": "unknown",
            "parameters": {}
        }