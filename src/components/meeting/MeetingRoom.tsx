
"use client";

import {
  DisconnectButton,
  GridLayout,
  LiveKitRoom,
  MediaDeviceMenu,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useTrackRefContext,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

type MeetingRoomProps = {
  token: string;
  serverUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  onLeave: () => void;
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

  const displayName =
    participant.name || participant.identity;

  const participantType = getParticipantType(
    participant.metadata,
    participant.identity,
  );

  const cameraEnabled = participant.isCameraEnabled;

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-gray-900">
      <ParticipantTile
        trackRef={trackRef}
        className="h-full w-full"
      />

      {!cameraEnabled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300">
          <div className="text-center">
            <p className="text-lg font-medium">
              Voice only
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Camera is off
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
        <span className="font-medium">
          {displayName}
        </span>

        <span
          className={
            participantType === "Agent"
              ? "rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold"
              : "rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold"
          }
        >
          {participantType}
        </span>

        {!cameraEnabled && (
          <span className="rounded-full bg-gray-600 px-2 py-0.5 text-xs">
            Camera off
          </span>
        )}
      </div>
    </div>
  );
}

function MeetingControls() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-4 py-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Microphone */}
        <div className="flex items-center gap-1">
          <TrackToggle
            source={Track.Source.Microphone}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Microphone
          </TrackToggle>

          <MediaDeviceMenu
            kind="audioinput"
            className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
          />
        </div>

        {/* Camera */}
        <div className="flex items-center gap-1">
          <TrackToggle
            source={Track.Source.Camera}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Camera
          </TrackToggle>

          <MediaDeviceMenu
            kind="videoinput"
            className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
          />
        </div>

        {/* Leave */}
        <DisconnectButton
          stopTracks
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Leave
        </DisconnectButton>
      </div>
    </footer>
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
          <h1 className="text-xl font-semibold">
            Meeting Room
          </h1>

          <p className="text-sm text-gray-400">
            {tracks.length} participant
            {tracks.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <GridLayout
        tracks={tracks}
        className="min-h-0 flex-1 gap-4 p-4"
      >
        <MeetingParticipantTile />
      </GridLayout>

      <MeetingControls />

      <RoomAudioRenderer />
    </main>
  );
}

export default function MeetingRoom({
  token,
  serverUrl,
  audioEnabled,
  videoEnabled,
  onLeave,
}: MeetingRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={audioEnabled}
      video={videoEnabled}
      onDisconnected={onLeave}
      data-lk-theme="default"
      className="h-screen"
    >
      <MeetingRoomContent />
    </LiveKitRoom>
  );
}
