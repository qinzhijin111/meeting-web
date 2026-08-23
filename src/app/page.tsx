
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl px-6">
        <h1 className="text-4xl font-bold mb-6">
          Agent-Enabled Meeting Platform
        </h1>

        <p className="text-lg mb-8">
          A Zoom-like meeting application where human participants
          and specialized AI agents can join the same LiveKit room.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Project Features
        </h2>

        <ul className="space-y-2">
          <li>Real-time video meetings</li>
          <li>Human participants and AI agents</li>
          <li>AI meeting notes</li>
          <li>AI assistant and translation</li>
        </ul>
      </div>
    </main>
  );
}
