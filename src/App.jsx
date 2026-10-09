import { useState } from "react";
import "./App.css";

const agents = [
  {
    id: "safe_search",
    codename: "SENTINEL",
    name: "Safe Search",
    type: "TRUSTED AGENT",
    icon: "●",
    description:
      "Performs safe information retrieval within approved boundaries.",
    riskValue: 10,
    color: "green",
  },
  {
    id: "prompt_injection",
    codename: "PHANTOM",
    name: "Prompt Injection",
    type: "MANIPULATION DETECTOR",
    icon: "◆",
    description:
      "Detects external instructions attempting to manipulate an AI agent.",
    riskValue: 85,
    color: "orange",
  },
  {
    id: "data_exfiltration",
    codename: "EXFIL",
    name: "Data Exfiltration",
    type: "DATA PROTECTION",
    icon: "▲",
    description:
      "Detects attempts to move sensitive information to unsafe destinations.",
    riskValue: 100,
    color: "red",
  },
  {
    id: "unauthorized_delete",
    codename: "AEGIS",
    name: "Unauthorized Deletion",
    type: "ACTION GUARDIAN",
    icon: "◇",
    description:
      "Prevents autonomous agents from performing destructive actions without authorization.",
    riskValue: 100,
    color: "purple",
  },
];

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);

  const [testsRun, setTestsRun] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [agentTrust, setAgentTrust] = useState(100);

  const [events, setEvents] = useState([]);
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [approvalDecision, setApprovalDecision] = useState(null);

  const runAgent = async (agent) => {
    setLoading(true);
    setResult(null);
    setActiveAgent(agent.id);
    setApprovalRequest(null);
    setApprovalDecision(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/attack/${agent.id}`
      );

      const data = await response.json();

      setResult(data);

      if (data.security.decision === "REQUIRE_APPROVAL") {
        setApprovalRequest(data);
      }

      const newEvent = {
        id: Date.now(),
        agent: agent.codename,
        name: agent.name,
        decision: data.security.decision,
        risk: data.security.risk_score,
        level: data.security.risk_level,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 8));

      setTestsRun((prev) => prev + 1);

      if (data.security.decision === "BLOCK") {
        setThreatsBlocked((prev) => prev + 1);
      }

      let trustPenalty = 0;

      if (data.security.risk_score >= 80) {
        trustPenalty = 15;
      } else if (data.security.risk_score >= 60) {
        trustPenalty = 10;
      } else if (data.security.risk_score >= 30) {
        trustPenalty = 5;
      }

      setAgentTrust((prev) =>
        Math.max(0, prev - trustPenalty)
      );
    } catch (error) {
      setResult({
        error:
          "Unable to connect to AgentGuard backend. Make sure FastAPI is running.",
      });
    }

    setLoading(false);
  };

  const denyAction = () => {
    setApprovalDecision("DENIED");
    setApprovalRequest(null);

    const deniedEvent = {
      id: Date.now(),
      agent: "ORACLE",
      name: "External Email Action",
      decision: "DENIED",
      risk: 70,
      level: "HIGH",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setEvents((prev) => [deniedEvent, ...prev].slice(0, 8));
  };

  const approveAction = () => {
    setApprovalDecision("APPROVED");
    setApprovalRequest(null);

    const approvedEvent = {
      id: Date.now(),
      agent: "ORACLE",
      name: "External Email Action",
      decision: "APPROVED",
      risk: 70,
      level: "HIGH",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setEvents((prev) => [approvedEvent, ...prev].slice(0, 8));
  };

  const runFullSweep = async () => {
    setLoading(true);
    setResult(null);
    setApprovalRequest(null);
    setApprovalDecision(null);

    const scenarioIds = [
      "safe_search",
      "prompt_injection",
      "data_exfiltration",
      "unauthorized_delete",
      "approval_required",
    ];

    const sweepResults = [];

    try {
      for (const scenarioId of scenarioIds) {
        const response = await fetch(
          `http://127.0.0.1:8000/attack/${scenarioId}`
        );

        const data = await response.json();

        if (!data.error) {
          sweepResults.push(data);
        }
      }

      const blocked = sweepResults.filter(
        (item) => item.security.decision === "BLOCK"
      ).length;

      const approvals = sweepResults.filter(
        (item) => item.security.decision === "REQUIRE_APPROVAL"
      ).length;

      const allowed = sweepResults.filter(
        (item) => item.security.decision === "ALLOW"
      ).length;

      setTestsRun((prev) => prev + sweepResults.length);

      setThreatsBlocked((prev) => prev + blocked);

      const newEvents = sweepResults.map((item, index) => ({
        id: Date.now() + index,
        agent:
          item.scenario.type === "NORMAL"
            ? "SENTINEL"
            : item.scenario.type === "PROMPT_INJECTION"
            ? "PHANTOM"
            : item.scenario.type === "DATA_EXFILTRATION"
            ? "EXFIL"
            : item.scenario.type === "UNAUTHORIZED_ACTION"
            ? "AEGIS"
            : "ORACLE",
        name: item.scenario.name,
        decision: item.security.decision,
        risk: item.security.risk_score,
        level: item.security.risk_level,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));

      setEvents((prev) =>
        [...newEvents.reverse(), ...prev].slice(0, 8)
      );

      setResult({
        sweep: true,
        results: sweepResults,
        summary: {
          total: sweepResults.length,
          blocked,
          approvals,
          allowed,
        },
      });

      setAgentTrust((prev) =>
        Math.max(0, prev - blocked * 5)
      );
    } catch (error) {
      setResult({
        error:
          "Security sweep failed. Make sure the AgentGuard backend is running.",
      });
    }

    setLoading(false);
  };
  // =========================================
  // SECURITY INTELLIGENCE METRICS
  // =========================================

  const blockedCount = events.filter(
    (event) => event.decision === "BLOCK"
  ).length;

  const approvalCount = events.filter(
    (event) => event.decision === "REQUIRE_APPROVAL"
  ).length;

  const allowedCount = events.filter(
    (event) =>
      event.decision === "ALLOW" ||
      event.decision === "APPROVED"
  ).length;

  const highRiskCount = events.filter(
    (event) => event.risk >= 80
  ).length;

  const protectionRate =
    testsRun === 0
      ? 100
      : Math.round(
          ((blockedCount + approvalCount) / testsRun) * 100
        );
  return (
    <div className="app">
      <div className="aurora aurora-one"></div>
      <div className="aurora aurora-two"></div>
      <div className="grid-overlay"></div>

      <header className="header">
        <div className="brand">
          <div className="logo">🛡️</div>

          <div>
            <h1>AgentGuard</h1>
            <p>Autonomous AI Security & Trust Layer</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          SYSTEM ACTIVE
        </div>
      </header>

      <main className="dashboard">

        <section className="hero">
          <div className="hero-badge">
            ◈ REAL-TIME AGENT PROTECTION
          </div>

          <h2>
            Protecting AI
            <span> Before It Acts.</span>
          </h2>

          <p>
            AgentGuard evaluates intent, permissions and risk
            before autonomous AI actions reach the real world.
          </p>
        </section>


        {/* =====================================================
            AGENTGUARD SECURITY CORE
        ===================================================== */}

        <section className="security-core">

          <div className="core-header">

            <div className="mini-label">
              AUTONOMOUS DECISION FIREWALL
            </div>

            <h2>
              AgentGuard <span>Security Core</span>
            </h2>

            <p>
              Every autonomous action is inspected before it reaches
              the real world.
            </p>

          </div>


          <div className="core-flow">

            {/* USER INTENT */}

            <div className="flow-node">

              <div className="flow-icon">
                ◇
              </div>

              <span>
                USER INTENT
              </span>

              <small>
                What the user actually requested
              </small>

            </div>


            <div className="flow-line">
              <span>→</span>
            </div>


            {/* AI AGENT */}

            <div className="flow-node">

              <div className="flow-icon">
                ◉
              </div>

              <span>
                AI AGENT
              </span>

              <small>
                Proposed autonomous action
              </small>

            </div>


            <div className="flow-line">
              <span>→</span>
            </div>


            {/* SECURITY CORE */}

            <div className="core-reactor">

              <div className="reactor-ring ring-one"></div>

              <div className="reactor-ring ring-two"></div>

              <div className="reactor-center">

                <div className="reactor-shield">
                  🛡
                </div>

                <strong>
                  AG
                </strong>

              </div>

              <span className="reactor-label">
                SECURITY CORE
              </span>

            </div>


            <div className="flow-line">
              <span>→</span>
            </div>


            {/* DECISION */}

            <div className="flow-node decision-node">

              <div className="flow-icon">
                ✓
              </div>

              <span>
                DECISION
              </span>

              <small>
                Allow · Approve · Block
              </small>

            </div>

          </div>


          {/* SECURITY CHECKS */}

          <div className="core-checks">

            <div className="check-item">

              <span className="check-number">
                01
              </span>

              <div>
                <strong>
                  INTENT
                </strong>

                <small>
                  Does the action match the user's request?
                </small>
              </div>

            </div>


            <div className="check-item">

              <span className="check-number">
                02
              </span>

              <div>
                <strong>
                  RISK
                </strong>

                <small>
                  How dangerous is the proposed action?
                </small>
              </div>

            </div>


            <div className="check-item">

              <span className="check-number">
                03
              </span>

              <div>
                <strong>
                  PERMISSION
                </strong>

                <small>
                  Is this action authorized?
                </small>
              </div>

            </div>


            <div className="check-item">

              <span className="check-number">
                04
              </span>

              <div>
                <strong>
                  DESTINATION
                </strong>

                <small>
                  Is the target trusted and safe?
                </small>
              </div>

            </div>

          </div>


          {/* DECISION OUTPUT */}

          <div className="decision-output">

            <div className="decision-pill allowed">
              <span>●</span>
              ALLOW
            </div>

            <div className="decision-pill approval">
              <span>●</span>
              HUMAN APPROVAL
            </div>

            <div className="decision-pill blocked">
              <span>●</span>
              BLOCK
            </div>

          </div>

        </section>


        <section className="stats"></section>
        {/* SECURITY INTELLIGENCE */}

        <section className="intelligence-section">

          <div className="section-heading">

            <div>
              <div className="mini-label">
                SECURITY INTELLIGENCE
              </div>

              <h2>
                Threat Intelligence
              </h2>

              <p>
                Real-time overview of AgentGuard's security posture.
              </p>
            </div>

            <div className="intelligence-status">
              ● MONITORING
            </div>

          </div>


          <div className="intelligence-grid">

            {/* PROTECTION RATE */}

            <div className="intelligence-card protection-card">

              <div className="intelligence-icon">
                🛡️
              </div>

              <div className="intelligence-label">
                PROTECTION RATE
              </div>

              <strong>
                {protectionRate}%
              </strong>

              <div className="intelligence-bar">
                <div
                  style={{
                    width: `${protectionRate}%`,
                  }}
                ></div>
              </div>

              <span>
                Threats intercepted before execution
              </span>

            </div>


            {/* BLOCKED */}

            <div className="intelligence-card blocked-intel">

              <div className="intelligence-icon">
                🔴
              </div>

              <div className="intelligence-label">
                THREATS BLOCKED
              </div>

              <strong>
                {blockedCount}
              </strong>

              <span>
                Autonomous actions stopped
              </span>

            </div>


            {/* APPROVAL */}

            <div className="intelligence-card approval-intel">

              <div className="intelligence-icon">
                🟡
              </div>

              <div className="intelligence-label">
                HUMAN APPROVAL
              </div>

              <strong>
                {approvalCount}
              </strong>

              <span>
                Actions paused for authorization
              </span>

            </div>


            {/* HIGH RISK */}

            <div className="intelligence-card risk-intel">

              <div className="intelligence-icon">
                ⚠️
              </div>

              <div className="intelligence-label">
                HIGH-RISK ACTIONS
              </div>

              <strong>
                {highRiskCount}
              </strong>

              <span>
                Actions with risk ≥ 80
              </span>

            </div>

          </div>

        </section>
        <section className="attack-section">

          <div className="section-heading">

            <div>
              <div className="mini-label">
                SECURITY SIMULATION
              </div>

              <h2>
                Agent Defense Lab
              </h2>

              <p>
                Test how AgentGuard responds when autonomous agents
                encounter dangerous situations.
              </p>
            </div>

          </div>


          {/* FOUR SECURITY AGENTS */}
          {/* FULL SECURITY SWEEP */}

          <div className="sweep-control">

            <button
              className="sweep-button"
              onClick={runFullSweep}
              disabled={loading}
            >

              <span className="sweep-icon">
                ⚡
              </span>

              <span>
                {loading
                  ? "RUNNING SECURITY SWEEP..."
                  : "RUN FULL SECURITY SWEEP"}
              </span>

              <span className="sweep-arrow">
                →
              </span>

            </button>

          </div>

          <div className="agent-grid">

            {agents.map((agent, index) => (

              <button
                key={agent.id}
                className={`agent-card ${agent.color} ${
                  activeAgent === agent.id ? "active" : ""
                }`}
                onClick={() => runAgent(agent)}
              >

                <div className="card-top">

                  <div className="agent-icon">
                    {agent.icon}
                  </div>

                  <div className="agent-number">
                    0{index + 1}
                  </div>

                </div>


                <div className="agent-codename">
                  {agent.codename}
                </div>


                <h3>
                  {agent.name}
                </h3>


                <div className="agent-type">
                  {agent.type}
                </div>


                <div className="agent-risk">

                  <span>
                    THREAT INDEX
                  </span>

                  <strong>
                    {agent.riskValue}
                  </strong>

                  <small>
                    /100
                  </small>

                </div>


                <div className="risk-bar">

                  <div
                    className="risk-fill"
                    style={{
                      width: `${agent.riskValue}%`,
                    }}
                  ></div>

                </div>


                <p>
                  {agent.description}
                </p>


                <div className="card-footer">

                  <span>
                    initiate security test
                  </span>

                  <span className="arrow">
                    ↗
                  </span>

                </div>

              </button>

            ))}

          </div>


          {/* HUMAN APPROVAL TEST */}

          <div className="approval-test">

            <button
              className="approval-test-button"
              onClick={() =>
                runAgent({
                  id: "approval_required",
                  codename: "ORACLE",
                  name: "External Email Action",
                })
              }
            >

              <span>
                ◈
              </span>

              TEST HUMAN APPROVAL GATE

            </button>

          </div>

        </section>


        {/* LIVE SECURITY EVENTS */}

        <section className="events-section">

          <div className="section-heading">

            <div>

              <div className="mini-label">
                RUNTIME MONITOR
              </div>

              <h2>
                Live Security Events
              </h2>

              <p>
                Real-time record of autonomous agent decisions.
              </p>

            </div>


            <div className="live-indicator">

              <span></span>

              LIVE

            </div>

          </div>


          <div className="events-panel">

            {events.length === 0 ? (

              <div className="empty-events">

                <div className="empty-icon">
                  ◇
                </div>

                <strong>
                  No security events yet
                </strong>

                <p>
                  Run an agent simulation to begin monitoring.
                </p>

              </div>

            ) : (

              events.map((event) => {

                const isBlocked =
                  event.decision === "BLOCK";

                const isApproved =
                  event.decision === "APPROVED";

                const isDenied =
                  event.decision === "DENIED";


                return (

                  <div
                    className={`event-row ${
                      isBlocked
                        ? "event-blocked"
                        : isApproved
                        ? "event-approved"
                        : isDenied
                        ? "event-blocked"
                        : "event-allowed"
                    }`}
                    key={event.id}
                  >

                    <div className="event-status">

                      {isBlocked || isDenied
                        ? "!"
                        : "✓"}

                    </div>


                    <div className="event-time">
                      {event.time}
                    </div>


                    <div className="event-agent">

                      <strong>
                        {event.agent}
                      </strong>

                      <span>
                        {event.name}
                      </span>

                    </div>


                    <div className="event-decision">

                      <strong>

                        {isBlocked
                          ? "BLOCKED"
                          : isApproved
                          ? "APPROVED"
                          : isDenied
                          ? "DENIED"
                          : event.decision ===
                            "REQUIRE_APPROVAL"
                          ? "PENDING"
                          : "ALLOWED"}

                      </strong>

                      <span>
                        {event.level}
                      </span>

                    </div>


                    <div className="event-risk">
                      {event.risk}/100
                    </div>

                  </div>

                );

              })

            )}

          </div>

        </section>


        {/* LOADING / SCANNING */}

        {loading && (

          <section className="result-card scanning">

            <div className="scan-ring">
              ◈
            </div>

            <div>

              <div className="scan-label">
                AGENTGUARD ANALYZING
              </div>

              <h2>
                Evaluating Agent Behavior...
              </h2>

              <p>
                Checking intent · permissions · data sensitivity · risk
              </p>

            </div>

          </section>

        )}
        {/* FULL SECURITY SWEEP RESULT */}

        {result &&
          !loading &&
          !result.error &&
          result.sweep && (

          <section className="sweep-result-card">

            <div className="sweep-result-header">

              <div>

                <div className="result-label">
                  SECURITY SWEEP COMPLETE
                </div>

                <h2>
                  AgentGuard Defense Scan
                </h2>

                <p>
                  All configured security scenarios were evaluated.
                </p>

              </div>

              <div className="sweep-complete-badge">
                ✓ SCAN COMPLETE
              </div>

            </div>


            <div className="sweep-summary">

              <div className="sweep-stat">
                <span>TOTAL TESTS</span>
                <strong>
                  {result.summary.total}
                </strong>
              </div>


              <div className="sweep-stat blocked">
                <span>THREATS BLOCKED</span>
                <strong>
                  {result.summary.blocked}
                </strong>
              </div>


              <div className="sweep-stat approval">
                <span>APPROVAL REQUIRED</span>
                <strong>
                  {result.summary.approvals}
                </strong>
              </div>


              <div className="sweep-stat allowed">
                <span>ALLOWED</span>
                <strong>
                  {result.summary.allowed}
                </strong>
              </div>

            </div>


            <div className="sweep-results-list">

              {result.results.map((item, index) => (

                <div
                  className="sweep-result-row"
                  key={index}
                >

                  <div className="sweep-result-number">
                    0{index + 1}
                  </div>


                  <div className="sweep-result-info">

                    <strong>
                      {item.scenario.name}
                    </strong>

                    <span>
                      {item.agent_action.action}
                    </span>

                  </div>


                  <div className="sweep-result-risk">
                    {item.security.risk_score}/100
                  </div>


                  <div
                    className={`sweep-result-decision ${
                      item.security.decision === "BLOCK"
                        ? "blocked"
                        : item.security.decision ===
                          "REQUIRE_APPROVAL"
                        ? "approval"
                        : "allowed"
                    }`}
                  >

                    {item.security.decision === "BLOCK"
                      ? "BLOCKED"
                      : item.security.decision ===
                        "REQUIRE_APPROVAL"
                      ? "APPROVAL"
                      : "ALLOWED"}

                  </div>

                </div>

              ))}

            </div>

          </section>
        )}


        {/* SECURITY RESULT */}

        {result &&
  !loading &&
  !result.error &&
  !result.sweep && (

          <section
            className={`result-card ${
              result.security.decision === "BLOCK"
                ? "blocked-result"
                : result.security.decision ===
                  "REQUIRE_APPROVAL"
                ? "approval-result-card"
                : "allowed-result"
            }`}
          >

            <div className="result-header">

              <div>

                <div className="result-label">
                  SECURITY ANALYSIS COMPLETE
                </div>

                <h2>
                  {result.scenario.name}
                </h2>

              </div>


              <div
                className={
                  result.security.decision === "BLOCK"
                    ? "decision blocked"
                    : result.security.decision ===
                      "REQUIRE_APPROVAL"
                    ? "decision approval"
                    : "decision allowed"
                }
              >

                {result.security.decision === "BLOCK"
                  ? "🚫 BLOCKED"
                  : result.security.decision ===
                    "REQUIRE_APPROVAL"
                  ? "⚠️ APPROVAL REQUIRED"
                  : "🟢 ALLOWED"}

              </div>

            </div>


            <div className="risk-display">

              <div className="risk-circle">

                <strong>
                  {result.security.risk_score}
                </strong>

                <span>
                  /100
                </span>

              </div>


              <div>

                <div className="risk-title">
                  THREAT LEVEL
                </div>

                <h3 className="critical">
                  {result.security.risk_level}
                </h3>

              </div>

            </div>
            {/* PERMISSION FIREWALL */}

<div className="permission-firewall">

  <div className="permission-header">

    <div>
      <div className="mini-label">
        PERMISSION FIREWALL
      </div>

      <h2>
        Can this agent actually do this?
      </h2>

      <p>
        AgentGuard verifies whether the proposed action is
        authorized before allowing execution.
      </p>
    </div>

    <div
      className={`permission-badge ${
        result.security.permission === "AUTHORIZED"
          ? "permission-authorized"
          : result.security.permission === "HUMAN_APPROVAL"
          ? "permission-approval"
          : "permission-denied"
      }`}
    >
      {result.security.permission === "AUTHORIZED"
        ? "✓ AUTHORIZED"
        : result.security.permission === "HUMAN_APPROVAL"
        ? "⚠ HUMAN APPROVAL"
        : "✕ DENIED"}
    </div>

  </div>


  <div className="permission-flow">

    <div className="permission-step">

      <span className="permission-number">
        01
      </span>

      <strong>
        USER INTENT
      </strong>

      <p>
        {result.user_request}
      </p>

    </div>


    <div className="permission-arrow">
      →
    </div>


    <div className="permission-step">

      <span className="permission-number">
        02
      </span>

      <strong>
        AI ACTION
      </strong>

      <p>
        {result.agent_action.action}
      </p>

    </div>


    <div className="permission-arrow">
      →
    </div>


    <div className="permission-step">

      <span className="permission-number">
        03
      </span>

      <strong>
        PERMISSION
      </strong>

      <p>
        {result.security.permission}
      </p>

    </div>


    <div className="permission-arrow">
      →
    </div>


    <div className="permission-decision">

      <span>
        SECURITY DECISION
      </span>

      <strong>
        {result.security.decision}
      </strong>

    </div>

  </div>

</div>
            {/* INTENT DRIFT DETECTOR */}

            <div className="intent-drift-panel">

              <div className="intent-drift-header">

                <div>
                  <div className="intent-drift-label">
                    INTENT DRIFT DETECTOR
                  </div>

                  <h3>
                    Did the agent do what the user asked?
                  </h3>
                </div>

                <div
                  className={
                    result.intent_check.intent_match
                      ? "intent-status matched"
                      : "intent-status drifted"
                  }
                >
                  {result.intent_check.intent_match
                    ? "✓ INTENT MATCH"
                    : "⚠ INTENT DRIFT"}
                </div>

              </div>


              <div className="intent-flow">

                <div className="intent-node">

                  <div className="node-number">
                    01
                  </div>

                  <span className="node-label">
                    USER INTENT
                  </span>

                  <p>
                    {result.user_request}
                  </p>

                </div>


                <div className="intent-arrow">
                  →
                </div>


                <div className="intent-node agent-node">

                  <div className="node-number">
                    02
                  </div>

                  <span className="node-label">
                    AI PROPOSED ACTION
                  </span>

                  <p>
                    {result.agent_action.action}
                  </p>

                </div>


                <div className="intent-arrow">
                  →
                </div>


                <div
                  className={`intent-verdict ${
                    result.intent_check.intent_match
                      ? "verdict-safe"
                      : "verdict-danger"
                  }`}
                >

                  <strong>
                    {result.intent_check.intent_match
                      ? "MATCH"
                      : "DRIFT"}
                  </strong>

                  <span>
                    {result.intent_check.intent_match
                      ? "Action aligns with user intent"
                      : "Action deviates from user intent"}
                  </span>

                </div>

              </div>


              {!result.intent_check.intent_match && (

                <div className="drift-warning">

                  <span className="warning-icon">
                    !
                  </span>

                  <div>

                    <strong>
                      Autonomous intent deviation detected
                    </strong>

                    <p>
                      AgentGuard prevented the agent from
                      acting outside the user's requested goal.
                    </p>

                  </div>

                </div>

              )}

            </div>
            <div className="reasoning-panel">

              <div className="reasoning-header">

                <div>

                  <span className="reasoning-label">
                    AI SECURITY REASONING
                  </span>

                  <h3>
                    Why AgentGuard made this decision
                  </h3>

                </div>


                <div className="reasoning-status">

                  {result.security.decision === "BLOCK"
                    ? "THREAT DETECTED"
                    : result.security.decision ===
                      "REQUIRE_APPROVAL"
                    ? "HUMAN REVIEW"
                    : "ACTION VERIFIED"}

                </div>

              </div>


              <div className="reasoning-list">

                {result.security.factors.map(
                  (factor, index) => (

                    <div
                      className="reasoning-item"
                      key={index}
                    >

                      <div className="reasoning-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>


                      <div className="reasoning-content">

                        <strong>
                          {factor}
                        </strong>


                        <span>

                          {factor
                            .toLowerCase()
                            .includes("intent")
                            ? "The requested task and proposed agent behavior are inconsistent."
                            : factor
                                .toLowerCase()
                                .includes("tool")
                            ? "This operation has elevated privileges and requires additional protection."
                            : factor
                                .toLowerCase()
                                .includes("sensitive")
                            ? "The action involves information that should not be exposed automatically."
                            : factor
                                .toLowerCase()
                                .includes("destination")
                            ? "The destination could not be verified as trusted."
                            : "AgentGuard identified this behavior as a security concern."}

                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>


              <div className="final-verdict">

                <div className="verdict-icon">

                  {result.security.decision === "BLOCK"
                    ? "!"
                    : result.security.decision ===
                      "REQUIRE_APPROVAL"
                    ? "?"
                    : "✓"}

                </div>


                <div>

                  <span>
                    FINAL DECISION
                  </span>


                  <strong>

                    {result.security.decision === "BLOCK"
                      ? "BLOCK — HUMAN AUTHORIZATION REQUIRED"
                      : result.security.decision ===
                        "REQUIRE_APPROVAL"
                      ? "PAUSED — HUMAN APPROVAL REQUIRED"
                      : "ALLOW — ACTION VERIFIED"}

                  </strong>

                </div>

              </div>

            </div>


            {/* ANALYSIS GRID */}

            <div className="analysis-grid">

              <div className="analysis-box">

                <span>
                  USER INTENT
                </span>

                <p>
                  {result.user_request}
                </p>

              </div>


              <div className="analysis-box">

                <span>
                  AGENT ACTION
                </span>

                <p>
                  {result.agent_action.action}
                </p>

              </div>


              <div className="analysis-box">

                <span>
                  INTENT MATCH
                </span>

                <p>

                  {result.intent_check.intent_match
                    ? "✅ MATCH"
                    : "❌ MISMATCH"}

                </p>

              </div>


              <div className="analysis-box">

                <span>
                  SECURITY DECISION
                </span>

                <p>
                  {result.security.reason}
                </p>

              </div>

            </div>


            {/* DETECTION SIGNALS */}

            <div className="factors">

              <span>
                DETECTION SIGNALS
              </span>


              <ul>

                {result.security.factors.map(
                  (factor, index) => (

                    <li key={index}>

                      <span>
                        ◆
                      </span>

                      {factor}

                    </li>

                  )
                )}

              </ul>

            </div>

          </section>

        )}


        {/* HUMAN APPROVAL GATE */}

        {approvalRequest && (

          <section className="approval-gate">

            <div className="approval-header">

              <div>

                <span>
                  HUMAN-IN-THE-LOOP SECURITY
                </span>

                <h2>
                  Action Requires Your Approval
                </h2>

              </div>


              <div className="approval-badge">
                APPROVAL REQUIRED
              </div>

            </div>


            <div className="approval-risk">

              <div className="approval-score">

                <strong>
                  {approvalRequest.security.risk_score}
                </strong>

                <small>
                  /100
                </small>

              </div>


              <div>

                <span>
                  PROPOSED ACTION
                </span>

                <strong>
                  {approvalRequest.agent_action.action}
                </strong>

              </div>

            </div>


            <div className="approval-details">

              <div>

                <span>
                  USER INTENT
                </span>

                <p>
                  {approvalRequest.user_request}
                </p>

              </div>


              <div>

                <span>
                  RECIPIENT
                </span>

                <p>

                  {
                    approvalRequest.agent_action
                      .parameters.recipient
                  }

                </p>

              </div>

            </div>


            <div className="approval-warning">

              <strong>
                ⚠️ AgentGuard paused execution.
              </strong>

              <p>
                This action is not automatically safe.
                Human authorization is required before
                the agent can proceed.
              </p>

            </div>


            <div className="approval-actions">

              <button
                className="deny-button"
                onClick={denyAction}
              >
                DENY ACTION
              </button>


              <button
                className="approve-button"
                onClick={approveAction}
              >
                APPROVE ACTION
              </button>

            </div>

          </section>

        )}


        {/* HUMAN DECISION RESULT */}

        {approvalDecision && (

          <section
            className={`approval-result ${
              approvalDecision === "APPROVED"
                ? "approved-result"
                : "denied-result"
            }`}
          >

            <div className="approval-result-icon">

              {approvalDecision === "APPROVED"
                ? "✓"
                : "!"}

            </div>


            <div>

              <span>
                HUMAN DECISION
              </span>


              <h3>

                {approvalDecision === "APPROVED"
                  ? "ACTION APPROVED"
                  : "ACTION DENIED"}

              </h3>


              <p>

                {approvalDecision === "APPROVED"
                  ? "AgentGuard released the proposed action after human authorization."
                  : "AgentGuard stopped the proposed action. The agent cannot continue."}

              </p>

            </div>

          </section>

        )}


        {/* ERROR */}

        {result?.error && (

          <section className="result-card error">

            <h2>
              ⚠️ Connection Error
            </h2>

            <p>
              {result.error}
            </p>

          </section>

        )}

      </main>


      {/* FOOTER */}

      <footer>

        <span>
          AGENTGUARD
        </span>

        <span>
          •
        </span>

        AI AGENT SECURITY LAYER

        <span>
          •
        </span>

        HACKATHON PROTOTYPE

      </footer>

    </div>
  );
}

export default App;