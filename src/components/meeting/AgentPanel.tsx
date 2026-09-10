
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type AgentType =
  | "notes"
  | "assistant"
  | "translator";

type AgentOption = {
  type: AgentType;
  name: string;
  description: string;
};

type AgentState = {
  id: string;
  agent_type: AgentType;
  dispatch_id: string | null;
  status: string;
};

type AgentPanelProps = {
  roomId: string;
};

const agentOptions: AgentOption[] = [
  {
    type: "notes",
    name: "Note Taker",
    description:
      "Creates meeting notes, decisions, and action items.",
  },
  {
    type: "assistant",
    name: "Active Assistant",
    description:
      "Answers questions using meeting context and approved tools.",
  },
  {
    type: "translator",
    name: "Translator",
    description:
      "Provides translated captions during the meeting.",
  },
];

const ACTIVE_STATUSES = [
  "starting",
  "dispatched",
  "running",
  "stopping",
];

export default function AgentPanel({
  roomId,
}: AgentPanelProps) {
  const [
    agents,
    setAgents,
  ] = useState<AgentState[]>(
    [],
  );

  const [
    pendingAgent,
    setPendingAgent,
  ] =
    useState<AgentType | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState("");

  const loadAgents =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            `/api/rooms/${encodeURIComponent(
              roomId,
            )}/agents`,
          );

        const data =
          (await response.json()) as {
            agents?: AgentState[];
            error?: string;
          };

        if (!response.ok) {
          setError(
            data.error ??
              "Unable to load agents.",
          );

          return;
        }

        setAgents(
          data.agents ?? [],
        );
      } catch {
        setError(
          "Unable to load agents.",
        );
      }
    }, [roomId]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  async function startAgent(
    agentType: AgentType,
  ) {
    try {
      setError("");
      setPendingAgent(
        agentType,
      );

      const response =
        await fetch(
          `/api/rooms/${encodeURIComponent(
            roomId,
          )}/agents`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              agentType,
            }),
          },
        );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to start agent.",
        );

        return;
      }

      await loadAgents();
    } catch {
      setError(
        "Unable to start agent.",
      );
    } finally {
      setPendingAgent(null);
    }
  }

  function getActiveAgent(
    agentType: AgentType,
  ) {
    return agents.find(
      (agent) =>
        agent.agent_type ===
          agentType &&
        ACTIVE_STATUSES.includes(
          agent.status,
        ),
    );
  }

  return (
    <aside className="w-full rounded-xl border border-gray-800 bg-gray-900 p-4 lg:w-80 lg:shrink-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Agents
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Host controls
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-950 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {agentOptions.map(
          (agent) => {
            const activeAgent =
              getActiveAgent(
                agent.type,
              );

            const isPending =
              pendingAgent ===
              agent.type;

            return (
              <div
                key={agent.type}
                className="rounded-lg border border-gray-700 bg-gray-950 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-white">
                      {agent.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      {
                        agent.description
                      }
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-200">
                    {activeAgent
                      ? activeAgent.status
                      : "Available"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    isPending ||
                    Boolean(
                      activeAgent,
                    )
                  }
                  onClick={() => {
                    void startAgent(
                      agent.type,
                    );
                  }}
                  className="mt-4 w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  {isPending
                    ? "Starting..."
                    : activeAgent
                      ? "Agent active"
                      : "Start Agent"}
                </button>
              </div>
            );
          },
        )}
      </div>
    </aside>
  );
}
