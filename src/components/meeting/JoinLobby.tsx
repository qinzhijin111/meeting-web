

"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type JoinLobbyProps = {
  roomId: string;
};

type JoinResponse = {
  token?: string;
  serverUrl?: string;
  participantIdentity?: string;

  error?: string;
  code?: string;
};

export default function JoinLobby({
  roomId,
}: JoinLobbyProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [displayName, setDisplayName] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [micEnabled, setMicEnabled] =
    useState(true);

  const [cameraEnabled, setCameraEnabled] =
    useState(true);

  const [deviceError, setDeviceError] =
    useState("");

  const [joinError, setJoinError] =
    useState("");

  const [joinSuccess, setJoinSuccess] =
    useState("");

  const [isJoining, setIsJoining] =
    useState(false);

  useEffect(() => {
    async function startPreview() {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setDeviceError(
          "Unable to access your microphone or camera. Please check your browser permissions."
        );
      }
    }

    startPreview();

    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });
    };
  }, []);

  function toggleMicrophone() {
    const audioTracks =
      streamRef.current?.getAudioTracks();

    if (
      !audioTracks ||
      audioTracks.length === 0
    ) {
      return;
    }

    const nextState = !micEnabled;

    audioTracks.forEach((track) => {
      track.enabled = nextState;
    });

    setMicEnabled(nextState);
  }

  function toggleCamera() {
    const videoTracks =
      streamRef.current?.getVideoTracks();

    if (
      !videoTracks ||
      videoTracks.length === 0
    ) {
      return;
    }

    const nextState = !cameraEnabled;

    videoTracks.forEach((track) => {
      track.enabled = nextState;
    });

    setCameraEnabled(nextState);
  }

  async function handleJoin(
    event: React.SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setJoinError("");
    setJoinSuccess("");

    if (!displayName.trim()) {
      setJoinError(
        "Please enter a display name."
      );
      return;
    }

    if (!password) {
      setJoinError(
        "Please enter the room password."
      );
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(
          roomId
        )}/join`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            displayName:
              displayName.trim(),
            password,
          }),
        }
      );

      const data: JoinResponse =
        await response.json();

      if (!response.ok) {
        setJoinError(
          data.error ||
            "Unable to join this room."
        );

        return;
      }

      if (
        !data.token ||
        !data.serverUrl
      ) {
        setJoinError(
          "The server did not return valid meeting credentials."
        );

        return;
      }

      // Task 6 is working:
      // the browser received a short-lived,
      // room-scoped LiveKit token from the server.
      //
      // Do not console.log the token.

      setJoinSuccess(
        "Room access approved. LiveKit credentials were issued successfully."
      );

      setPassword("");
    } catch {
      setJoinError(
        "Unable to contact the server. Please try again."
      );
    } finally {
      setIsJoining(false);
    }
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

        {deviceError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {deviceError}
          </div>
        )}

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={toggleMicrophone}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {micEnabled
              ? "Mute microphone"
              : "Unmute microphone"}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cameraEnabled
              ? "Turn camera off"
              : "Turn camera on"}
          </button>
        </div>

        <form
          onSubmit={handleJoin}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Display name
            </label>

            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(
                  event.target.value
                )
              }
              required
              maxLength={80}
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
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {joinError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {joinSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoining
              ? "Joining..."
              : "Join Room"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Room ID: {roomId}
        </p>
      </div>
    </main>
  );
}
