
"use client";

type AgentOption = {
  type: "notes" | "assistant" | "translator";
  name: string;
  description: string;
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

export default function AgentPanel() {
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

      <div className="space-y-3">
        {agentOptions.map((agent) => (
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
                  {agent.description}
                </p>
              </div>

              <span className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-200">
                Available
              </span>
            </div>

            <button
              type="button"
              disabled
              title="Agent dispatch will be connected in the next build task."
              className="mt-4 w-full cursor-not-allowed rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-400"
            >
              Start Agent
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Agent start/stop API will be connected in the next build task.
      </p>
    </aside>
  );
}
