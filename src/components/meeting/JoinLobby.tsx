
"use client";

import { useEffect, useRef, useState } from "react";

type JoinLobbyProps = {
  roomId: string;
  defaultDisplayName: string;
};

export default function JoinLobby({
  roomId,
  defaultDisplayName,
}: JoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [password, setPassword] = useState("");

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [deviceError, setDeviceError] = useState("");

  useEffect(() => {
    async function startPreview() {
      try {
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
          "Unable to access your microphone or camera. Please check your browser permissions."
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
            {micEnabled ? "Mute microphone" : "Unmute microphone"}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cameraEnabled ? "Turn camera off" : "Turn camera on"}
          </button>
        </div>

        <div className="space-y-4">
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
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Enter your display name"
              required
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter room password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md bg-blue-400 py-2 font-medium text-white"
          >
            Join Room
          </button>

          <p className="text-center text-xs text-gray-400">
            Room ID: {roomId}
          </p>
        </div>
      </div>
    </main>
  );
}
