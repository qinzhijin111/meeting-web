
"use client";

import {
  useParticipants,
} from "@livekit/components-react";

import type {
  Participant,
} from "livekit-client";


function isNoteTaker(
  participant: Participant,
): boolean {
  if (
    participant.attributes?.[
      "agent.type"
    ] === "notes"
  ) {
    return true;
  }

  try {
    const metadata =
      JSON.parse(
        participant.metadata ||
          "{}",
      ) as {
        participantType?: string;
        agentType?: string;
      };

    return (
      metadata.participantType
        === "agent"
      && metadata.agentType
        === "notes"
    );
  } catch {
    return false;
  }
}


export default function AITranscriptionNotice() {
  const participants =
    useParticipants();

  const noteTakerActive =
    participants.some(
      isNoteTaker,
    );

  if (!noteTakerActive) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-yellow-500/50 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-100"
    >
      <strong>
        AI transcription is active.
      </strong>{" "}

      The Note Taker is processing meeting
      audio to create AI-generated notes.
      AI output may be inaccurate.
    </div>
  );
}
