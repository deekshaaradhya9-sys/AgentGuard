from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import AIAgent
from agentguard import evaluate_action
from intent_checker import check_intent
from scenarios import get_scenario
from tool_gateway import AgentGuardGateway


app = FastAPI(title="AgentGuard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AIAgent()
gateway=AgentGuardGateway()
class UserRequest(BaseModel):
    request: str


@app.get("/")
def home():
    return {
        "project": "AgentGuard",
        "status": "running",
        "message": "AI Agent Security Layer is active"
    }


@app.post("/agent")
def run_agent(user_request: UserRequest):

    # Step 1: AI Agent decides what it wants to do
    action = agent.decide_action(user_request.request)

    # Step 2: AgentGuard evaluates security risk
    # the action matches what the user actually asked
    intent_result = check_intent(
            user_request.request,
            action
        )
    security_result = evaluate_action(action,intent_result)

    return {
        "user_request": user_request.request,
        "agent_action": action,
        "intent_check": intent_result,
        "security": security_result
    }
@app.get("/attack/{scenario_id}")
def run_attack(scenario_id: str):

    # Get the predefined security scenario
    scenario = get_scenario(scenario_id)

    if scenario is None:
        return {
            "error": "Scenario not found"
        }

    user_request = scenario["user_request"]
    action = scenario["action"]

    # Check whether the action matches the user's intention
    intent_result = check_intent(
        user_request,
        action
    )

    # Calculate security risk
    security_result = evaluate_action(
        action,
        intent_result
    )

    return {
        "scenario": {
            "name": scenario["name"],
            "type": scenario["type"],
            "description": scenario["description"]
        },

        "user_request": user_request,

        "agent_action": action,

        "intent_check": intent_result,

        "security": security_result
    }
@app.post("/gateway")
def gateway_test(user_request: UserRequest):

    action = agent.decide_action(
        user_request.request
    )

    result = gateway.intercept(
        user_request.request,
        action
    )

    return {
        "user_request": user_request.request,
        "proposed_action": action,
        "gateway_result": result
    }
@app.post("/gateway")
def gateway_test(user_request: UserRequest):
    action = agent.decide_action(user_request.request)

    result = gateway.intercept(
        user_request.request,
        action
    )

    return {
        "user_request": user_request.request,
        "proposed_action": action,
        "gateway_result": result
    }