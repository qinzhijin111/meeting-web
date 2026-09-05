
"use client";

import {
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import MeetingRoom from "@/components/meeting/MeetingRoom";

type JoinLobbyProps = {
  roomId: string;
};

type MeetingCredentials = {
  token: string;
  serverUrl: string;
};

type JoinResponse = {
  token?: string;
  serverUrl?: string;
  participantIdentity?: string;
  error?: string;
  code?: string;
};

export default function JoinLobby({ roomId }: JoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [deviceError, setDeviceError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const [meetingCredentials, setMeetingCredentials] =
    useState<MeetingCredentials | null>(null);

  useEffect(() => {
    async function startPreview() {
      try {
        setDeviceError("");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setDeviceError(
          "Unable to access your microphone or camera. Please check your browser permissions.",
        );
      }
    }

    startPreview();

    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  function toggleMicrophone() {
    const audioTracks = streamRef.current?.getAudioTracks();

    if (!audioTracks || audioTracks.length === 0) {
      return;
    }

    const nextState = !micEnabled;

    audioTracks.forEach((track) => {
      track.enabled = nextState;
    });

    setMicEnabled(nextState);
  }

  function toggleCamera() {
    const videoTracks = streamRef.current?.getVideoTracks();

    if (!videoTracks || videoTracks.length === 0) {
      return;
    }

    const nextState = !cameraEnabled;

    videoTracks.forEach((track) => {
      track.enabled = nextState;
    });

    setCameraEnabled(nextState);
  }

  function stopPreview() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function handleJoin(
    event: SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setJoinError("");

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setJoinError("Please enter a display name.");
      return;
    }

    if (!password) {
      setJoinError("Please enter the room password.");
      return;
    }

    try {
      setIsJoining(true);

      const response = await fetch(
        `/api/rooms/${encodeURIComponent(roomId)}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: trimmedDisplayName,
            password,
          }),
        },
      );

      const data = (await response.json()) as JoinResponse;

      if (!response.ok) {
        setJoinError(
          data.error ?? "Unable to join this room.",
        );
        return;
      }

      if (!data.token || !data.serverUrl) {
        setJoinError(
          "Meeting credentials are missing. Please try again.",
        );
        return;
      }

      /*
       * Stop the Join Lobby preview before LiveKit starts
       * using the microphone and camera.
       */
      stopPreview();

      /*
       * Do not keep the room password in component state
       * after the Join API has approved access.
       */
      setPassword("");

      /*
       * Switching this state causes the component to render
       * the real LiveKit Meeting Room below.
       */
      setMeetingCredentials({
        token: data.token,
        serverUrl: data.serverUrl,
      });
    } catch {
      setJoinError(
        "Unable to connect to the meeting service. Please try again.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  /*
   * Once the Join API returns valid LiveKit credentials,
   * leave the Lobby UI and render the actual Meeting Room.
   */
  if (meetingCredentials) {
    return (
      <MeetingRoom
        token={meetingCredentials.token}
        serverUrl={meetingCredentials.serverUrl}
        audioEnabled={micEnabled}
        videoEnabled={cameraEnabled}
        onLeave={() => {
        window.location.reload();
      }}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Join Meeting
        </h1>

        <p className="mb-6 text-center text-sm text-gray-500">
          Check your devices before joining
        </p>

        {/* Camera preview */}
        <div className="relative mb-6 overflow-hidden rounded-lg bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full object-cover"
          />

          {!cameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300">
              Camera is off
            </div>
          )}
        </div>

        {/* Device permission error */}
        {deviceError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {deviceError}
          </div>
        )}

        {/* Microphone and camera controls */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={toggleMicrophone}
            className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
          >
            {micEnabled
              ? "Mute microphone"
              : "Unmute microphone"}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
          >
            {cameraEnabled
              ? "Turn camera off"
              : "Turn camera on"}
          </button>
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Display name
            </label>

            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              placeholder="Enter your display name"
              required
              maxLength={80}
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Room password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter room password"
              required
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {joinError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {joinError}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
        </form>

        <p className="mt-6 break-all text-center text-xs text-gray-400">
          Room ID: {roomId}
        </p>
      </div>
    </main>
  );
}
