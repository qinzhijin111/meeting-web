
"use client";

import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTrackRefContext,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

type MeetingRoomProps = {
  token: string;
  serverUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
};

function getParticipantType(
  metadata: string | undefined,
  identity: string,
): "Human" | "Agent" {
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as {
        participantType?: string;
      };

      if (parsed.participantType === "agent") {
        return "Agent";
      }

      if (parsed.participantType === "human") {
        return "Human";
      }
    } catch {
      // Ignore invalid metadata and use identity fallback.
    }
  }

  return identity.startsWith("agent:") ? "Agent" : "Human";
}

function MeetingParticipantTile() {
  const trackRef = useTrackRefContext();
  const participant = trackRef.participant;

  const displayName = participant.name || participant.identity;

  const participantType = getParticipantType(
    participant.metadata,
    participant.identity,
  );

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-gray-900">
      <ParticipantTile
        trackRef={trackRef}
        className="h-full w-full"
      />

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
        <span className="font-medium">{displayName}</span>

        <span
          className={
            participantType === "Agent"
              ? "rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold"
              : "rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold"
          }
        >
          {participantType}
        </span>
      </div>
    </div>
  );
}

function MeetingRoomContent() {
  const tracks = useTracks([
    {
      source: Track.Source.Camera,
      withPlaceholder: true,
    },
  ]);

  return (
    <main className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Meeting Room</h1>
          <p className="text-sm text-gray-400">
            {tracks.length} participant{tracks.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <GridLayout
        tracks={tracks}
        className="min-h-0 flex-1 gap-4 p-4"
      >
        <MeetingParticipantTile />
      </GridLayout>

      <RoomAudioRenderer />
    </main>
  );
}

export default function MeetingRoom({
  token,
  serverUrl,
  audioEnabled,
  videoEnabled,
}: MeetingRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={audioEnabled}
      video={videoEnabled}
      data-lk-theme="default"
      className="h-screen"
    >
      <MeetingRoomContent />
    </LiveKitRoom>
  );
}
