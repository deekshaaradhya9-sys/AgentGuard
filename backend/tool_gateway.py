from agentguard import evaluate_action
from intent_checker import check_intent


class AgentGuardGateway:
    def __init__(self):
        self.execution_log = []

    def intercept(self, user_request, proposed_action):
        intent_result = check_intent(
            user_request,
            proposed_action
        )

        security_result = evaluate_action(
            proposed_action,
            intent_result
        )

        self.execution_log.append({
            "user_request": user_request,
            "action": proposed_action,
            "intent": intent_result,
            "security": security_result
        })

        decision = security_result["decision"]

        if decision == "ALLOW":
            message = "AgentGuard authorized the tool call."
            executed = True
        elif decision == "REQUIRE_APPROVAL":
            message = "AgentGuard paused the tool call for human approval."
            executed = False
        else:
            message = "AgentGuard blocked the unsafe tool call."
            executed = False

        return {
            "executed": executed,
            "decision": decision,
            "message": message,
            "security": security_result
        }