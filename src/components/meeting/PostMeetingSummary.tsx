
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";


type NotesStatus =
  | "waiting"
  | "processing"
  | "ready"
  | "partial"
  | "error";


type ActionItem = {
  description: string;
  owner?: string | null;
  dueDate?: string | null;
};


type MeetingNotes = {
  id: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};


type NotesResponse = {
  room?: {
    publicId: string;
    title: string;
  };

  status?: NotesStatus;

  notes?: MeetingNotes | null;

  error?: string;
};


type Props = {
  roomId: string;
};


function StatusCard({
  status,
}: {
  status: NotesStatus;
}) {
  if (status === "waiting") {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h2 className="text-lg font-semibold text-white">
          Waiting for meeting notes
        </h2>

        <p className="mt-2 text-sm text-gray-300">
          The Note Taker has not produced
          meeting output yet.
        </p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="rounded-xl border border-blue-700 bg-blue-950/40 p-5">
        <h2 className="text-lg font-semibold text-blue-200">
          Processing meeting notes
        </h2>

        <p className="mt-2 text-sm text-blue-100">
          The transcript is being converted
          into a summary, decisions, action
          items, and open questions.
        </p>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div className="rounded-xl border border-yellow-700 bg-yellow-950/40 p-5">
        <h2 className="text-lg font-semibold text-yellow-200">
          Partial meeting notes
        </h2>

        <p className="mt-2 text-sm text-yellow-100">
          Some meeting output is available,
          but final note generation did not
          complete successfully.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-700 bg-red-950/40 p-5">
        <h2 className="text-lg font-semibold text-red-200">
          Meeting note generation failed
        </h2>

        <p className="mt-2 text-sm text-red-100">
          The Note Taker could not create a
          complete meeting output.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-700 bg-green-950/40 p-5">
      <h2 className="text-lg font-semibold text-green-200">
        Meeting notes ready
      </h2>

      <p className="mt-2 text-sm text-green-100">
        AI-generated output is available below.
      </p>
    </div>
  );
}


export default function PostMeetingSummary({
  roomId,
}: Props) {
  const [
    status,
    setStatus,
  ] = useState<NotesStatus>(
    "waiting",
  );

  const [
    notes,
    setNotes,
  ] = useState<
    MeetingNotes | null
  >(null);

  const [
    roomTitle,
    setRoomTitle,
  ] = useState(
    "Meeting Summary",
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadNotes =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            `/api/rooms/${encodeURIComponent(
              roomId,
            )}/notes`,
            {
              cache: "no-store",
            },
          );

        const data =
          (await response.json()) as
            NotesResponse;

        if (!response.ok) {
          setError(
            data.error ??
              "Unable to load meeting notes.",
          );

          return;
        }

        setError("");

        if (data.room?.title) {
          setRoomTitle(
            data.room.title,
          );
        }

        setStatus(
          data.status ??
            "waiting",
        );

        setNotes(
          data.notes ??
            null,
        );
      } catch {
        setError(
          "Unable to load meeting notes.",
        );
      } finally {
        setLoading(false);
      }
    }, [roomId]);


  // Initial load.
  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);


  // Poll while output is not final.
  useEffect(() => {
    if (
      status !== "waiting"
      && status !== "processing"
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void loadNotes();
        },
        2000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    status,
    loadNotes,
  ]);


  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl p-6 text-white">
        <p>
          Loading meeting notes...
        </p>
      </main>
    );
  }


  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 text-white">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Post-Meeting Summary
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {roomTitle}
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          AI-generated notes may contain
          mistakes. Verify important decisions
          and action items.
        </p>
      </header>


      {error ? (
        <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-100">
          {error}
        </div>
      ) : null}


      <StatusCard
        status={status}
      />


      {notes ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold">
              Summary
            </h2>

            <div className="mt-3 rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-200">
              {notes.summary ||
                "No summary is available."}
            </div>
          </section>


          <section>
            <h2 className="text-2xl font-semibold">
              Decisions
            </h2>

            {notes.decisions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {notes.decisions.map(
                  (
                    decision,
                    index,
                  ) => (
                    <li
                      key={`${decision}-${index}`}
                      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                    >
                      {decision}
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="mt-3 text-gray-400">
                No decisions were identified.
              </p>
            )}
          </section>


          <section>
            <h2 className="text-2xl font-semibold">
              Action Items
            </h2>

            {notes.actionItems.length > 0 ? (
              <div className="mt-3 space-y-3">
                {notes.actionItems.map(
                  (
                    item,
                    index,
                  ) => (
                    <article
                      key={`${item.description}-${index}`}
                      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                    >
                      <p className="font-medium">
                        {item.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>
                          Owner:{" "}
                          {item.owner ??
                            "Unknown"}
                        </span>

                        <span>
                          Due:{" "}
                          {item.dueDate ??
                            "Not specified"}
                        </span>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-3 text-gray-400">
                No action items were identified.
              </p>
            )}
          </section>


          <section>
            <h2 className="text-2xl font-semibold">
              Open Questions
            </h2>

            {notes.openQuestions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {notes.openQuestions.map(
                  (
                    question,
                    index,
                  ) => (
                    <li
                      key={`${question}-${index}`}
                      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                    >
                      {question}
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="mt-3 text-gray-400">
                No open questions were identified.
              </p>
            )}
          </section>


          {notes.errorMessage ? (
            <section className="rounded-xl border border-yellow-700 bg-yellow-950/30 p-5">
              <h2 className="font-semibold text-yellow-200">
                Generation warning
              </h2>

              <p className="mt-2 text-sm text-yellow-100">
                {notes.errorMessage}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
