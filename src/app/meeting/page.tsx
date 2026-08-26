
"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";

import "@livekit/components-styles";

type TokenResponse = {
  token: string;
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
};

export default function MeetingPage() {
  const [connectionInfo, setConnectionInfo] =
    useState<TokenResponse | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
  let cancelled = false;

  async function getToken() {
    try {
      const response = await fetch("/api/token");

      if (!response.ok) {
        throw new Error("Failed to get LiveKit token");
      }

      const data: TokenResponse = await response.json();

      if (!cancelled) {
        setConnectionInfo(data);
      }
    } catch (err) {
      if (cancelled) {
        return;
      }

      console.error(err);
      setError("Could not connect to the meeting.");
    }
  }

  getToken();

  return () => {
    cancelled = true;
  };
}, []);


  if (error) {
    return <main>{error}</main>;
  }

  if (!connectionInfo) {
    return <main>Connecting to meeting...</main>;
  }

  return (
    <main style={{ height: "100vh" }}>
      <LiveKitRoom
        token={connectionInfo.token}
        serverUrl={connectionInfo.serverUrl}
        connect={true}
        audio={true}
        video={true}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </main>
  );
}
