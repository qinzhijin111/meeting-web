
"use client";

import { useRef, useState } from "react";

import {
  DisconnectButton,
  GridLayout,
  LiveKitRoom,
  MediaDeviceMenu,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTrackRefContext,
  useTracks,
} from "@livekit/components-react";

import { Track } from "livekit-client";

import AgentPanel from "@/components/meeting/AgentPanel";

type MeetingRoomProps = {
  token: string;
  serverUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isHost: boolean;
  roomId: string;
  onLeave: () => void;
};

type ParticipantType = "Human" | "Agent";

function getParticipantType(
  metadata: string | undefined,
  identity: string,
): ParticipantType {
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

  return identity.startsWith("agent:")
    ? "Agent"
    : "Human";
}

function ConnectionStatus({
  onReturnToLobby,
}: {
  onReturnToLobby: () => void;
}) {
  const connectionState = useConnectionState();

  const state =
    String(connectionState).toLowerCase();

  if (state.includes("reconnecting")) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-orange-100 px-3 py-2 text-sm font-medium text-orange-800">
        <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

        Reconnecting...
      </div>
    );
  }

  if (state === "connecting") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800">
        <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />

        Connecting...
      </div>
    );
  }

  if (state === "connected") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
        <span className="h-2 w-2 rounded-full bg-green-500" />

        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">
      <span className="font-medium">
        Disconnected
      </span>

      <button
        type="button"
        onClick={onReturnToLobby}
        className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700"
      >
        Return to lobby
      </button>
    </div>
  );
}

function MeetingParticipantTile() {
  const trackRef =
    useTrackRefContext();

  const participant =
    trackRef.participant;

  const displayName =
    participant.name ||
    participant.identity;

  const participantType =
    getParticipantType(
      participant.metadata,
      participant.identity,
    );

  const isScreenShare =
    trackRef.source ===
    Track.Source.ScreenShare;

  const cameraEnabled =
    participant.isCameraEnabled;

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-gray-900">
      <ParticipantTile
        trackRef={trackRef}
        className="h-full w-full"
      />

      {!isScreenShare &&
        !cameraEnabled && (
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
          {isScreenShare
            ? `${displayName}'s screen`
            : displayName}
        </span>

        {isScreenShare ? (
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold">
            Screen share
          </span>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function ScreenShareButton({
  onError,
}: {
  onError: (
    message: string,
  ) => void;
}) {
  const {
    localParticipant,
    isScreenShareEnabled,
  } = useLocalParticipant();

  const [
    isChanging,
    setIsChanging,
  ] = useState(false);

  async function toggleScreenShare() {
    try {
      setIsChanging(true);
      onError("");

      await localParticipant.setScreenShareEnabled(
        !isScreenShareEnabled,
      );
    } catch {
      onError(
        "Screen sharing was cancelled or could not be started.",
      );
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleScreenShare}
      disabled={isChanging}
      className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isChanging
        ? "Please wait..."
        : isScreenShareEnabled
          ? "Stop sharing"
          : "Share screen"}
    </button>
  );
}

type MeetingControlsProps = {
  initialAudioEnabled: boolean;
  initialVideoEnabled: boolean;
  onLeave: () => void;
  onDeviceError: (
    message: string,
  ) => void;
};

function MeetingControls({
  initialAudioEnabled,
  initialVideoEnabled,
  onLeave,
  onDeviceError,
}: MeetingControlsProps) {
  const room = useRoomContext();

  const {
    localParticipant,
  } = useLocalParticipant();

  /*
   * Remember the media state the user wants.
   *
   * This lets the app recover from a failed
   * microphone/camera device switch without
   * accidentally enabling a device that the
   * user intentionally disabled.
   */
  const microphoneWantedRef =
    useRef(initialAudioEnabled);

  const cameraWantedRef =
    useRef(initialVideoEnabled);

  async function recoverMicrophoneDevice(
    deviceId: string,
  ) {
    try {
      onDeviceError("");

      const shouldEnableMicrophone =
        microphoneWantedRef.current;

      await localParticipant.setMicrophoneEnabled(
        false,
      );

      const switched =
        await room.switchActiveDevice(
          "audioinput",
          deviceId,
          true,
        );

      if (!switched) {
        throw new Error(
          "Unable to switch microphone.",
        );
      }

      if (shouldEnableMicrophone) {
        await localParticipant.setMicrophoneEnabled(
          true,
          {
            deviceId,
          },
        );
      }
    } catch {
      onDeviceError(
        "Unable to use the selected microphone. Choose another microphone or check whether the device is available.",
      );
    }
  }

  async function recoverCameraDevice(
    deviceId: string,
  ) {
    try {
      onDeviceError("");

      const shouldEnableCamera =
        cameraWantedRef.current;

      await localParticipant.setCameraEnabled(
        false,
      );

      const switched =
        await room.switchActiveDevice(
          "videoinput",
          deviceId,
          true,
        );

      if (!switched) {
        throw new Error(
          "Unable to switch camera.",
        );
      }

      if (shouldEnableCamera) {
        await localParticipant.setCameraEnabled(
          true,
          {
            deviceId,
          },
        );
      }
    } catch {
      onDeviceError(
        "Unable to use the selected camera. Choose another camera or check whether the device is available.",
      );
    }
  }

  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-4 py-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Microphone */}
        <div className="flex items-center gap-1">
          <TrackToggle
            source={
              Track.Source.Microphone
            }
            onChange={(
              enabled,
              isUserInitiated,
            ) => {
              if (isUserInitiated) {
                microphoneWantedRef.current =
                  enabled;
              }
            }}
            onDeviceError={() => {
              onDeviceError(
                "Microphone access failed. Please allow microphone access in your browser settings.",
              );
            }}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Microphone
          </TrackToggle>

          <MediaDeviceMenu
            kind="audioinput"
            onActiveDeviceChange={(
              _kind,
              deviceId,
            ) => {
              void recoverMicrophoneDevice(
                deviceId,
              );
            }}
            className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
          />
        </div>

        {/* Camera */}
        <div className="flex items-center gap-1">
          <TrackToggle
            source={
              Track.Source.Camera
            }
            onChange={(
              enabled,
              isUserInitiated,
            ) => {
              if (isUserInitiated) {
                cameraWantedRef.current =
                  enabled;
              }
            }}
            onDeviceError={() => {
              onDeviceError(
                "Camera access failed. Please allow camera access in your browser settings.",
              );
            }}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Camera
          </TrackToggle>

          <MediaDeviceMenu
            kind="videoinput"
            onActiveDeviceChange={(
              _kind,
              deviceId,
            ) => {
              void recoverCameraDevice(
                deviceId,
              );
            }}
            className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
          />
        </div>

        {/* Screen share */}
        <ScreenShareButton
          onError={
            onDeviceError
          }
        />

        {/* Leave */}
        <DisconnectButton
          stopTracks
          onClick={onLeave}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Leave
        </DisconnectButton>
      </div>
    </footer>
  );
}

type MeetingRoomContentProps = {
  roomId: string;

  initialAudioEnabled: boolean;
  initialVideoEnabled: boolean;

  meetingError: string;

  setMeetingError: (
    message: string,
  ) => void;

  isHost: boolean;

  onLeave: () => void;
};

function MeetingRoomContent({
  roomId,
  initialAudioEnabled,
  initialVideoEnabled,
  meetingError,
  setMeetingError,
  isHost,
  onLeave,
}: MeetingRoomContentProps) {
  const tracks = useTracks([
    {
      source:
        Track.Source.Camera,
      withPlaceholder: true,
    },
    {
      source:
        Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  const participants =
    useParticipants();

  const humanCount =
    participants.filter(
      (participant) =>
        getParticipantType(
          participant.metadata,
          participant.identity,
        ) === "Human",
    ).length;

  return (
    <main className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">
            Meeting Room
          </h1>

          <p className="text-sm text-gray-400">
            {participants.length}{" "}
            participant
            {participants.length === 1
              ? ""
              : "s"}
            {" · "}
            {humanCount}/5 humans
          </p>
        </div>

        <ConnectionStatus
          onReturnToLobby={
            onLeave
          }
        />
      </header>

      {/* Visible meeting/device error */}
      {meetingError && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-200">
          <span>
            {meetingError}
          </span>

          <button
            type="button"
            onClick={() =>
              setMeetingError("")
            }
            className="font-medium text-red-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/*
       * Main meeting area.
       *
       * Hosts:
       * participant grid + AgentPanel
       *
       * Normal participants:
       * participant grid only
       */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Participant grid */}
        <GridLayout
          tracks={tracks}
          className="min-h-[300px] flex-1 gap-4"
        >
          <MeetingParticipantTile />
        </GridLayout>

        {/* Host-only Agents panel */}
        {isHost && (
          <AgentPanel
            roomId={roomId}
          />
        )}
      </div>

      {/* Media controls */}
      <MeetingControls
        initialAudioEnabled={
          initialAudioEnabled
        }
        initialVideoEnabled={
          initialVideoEnabled
        }
        onLeave={onLeave}
        onDeviceError={
          setMeetingError
        }
      />

      <RoomAudioRenderer />
    </main>
  );
}

export default function MeetingRoom({
  token,
  serverUrl,
  audioEnabled,
  videoEnabled,
  isHost,
  roomId,
  onLeave,
}: MeetingRoomProps) {
  const [
    meetingError,
    setMeetingError,
  ] = useState("");

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={audioEnabled}
      video={videoEnabled}
      data-lk-theme="default"
      className="h-screen"
      onConnected={() => {
        setMeetingError("");
      }}
      onDisconnected={() => {
        setMeetingError(
          "The meeting connection was lost. Check your network connection and rejoin if necessary.",
        );
      }}
      onError={(error) => {
        setMeetingError(
          error.message ||
            "Unable to connect to the meeting.",
        );
      }}
      onMediaDeviceFailure={(
        _failure,
        kind,
      ) => {
        if (
          kind === "audioinput"
        ) {
          setMeetingError(
            "Microphone access failed. Please allow microphone access in your browser settings.",
          );

          return;
        }

        if (
          kind === "videoinput"
        ) {
          setMeetingError(
            "Camera access failed. Please allow camera access in your browser settings.",
          );

          return;
        }

        setMeetingError(
          "A media device could not be accessed. Please check your browser permissions.",
        );
      }}
    >
      <MeetingRoomContent
        roomId={roomId}
        initialAudioEnabled={
          audioEnabled
        }
        initialVideoEnabled={
          videoEnabled
        }
        meetingError={
          meetingError
        }
        setMeetingError={
          setMeetingError
        }
        isHost={isHost}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
