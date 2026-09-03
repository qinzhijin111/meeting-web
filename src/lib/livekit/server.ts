
import {
  AccessToken,
  RoomServiceClient,
} from "livekit-server-sdk";

function getLiveKitCredentials() {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error(
      "Missing LiveKit server environment variables."
    );
  }

  return {
    livekitUrl,
    apiKey,
    apiSecret,
  };
}

export function createRoomServiceClient() {
  const {
    livekitUrl,
    apiKey,
    apiSecret,
  } = getLiveKitCredentials();

  return new RoomServiceClient(
    livekitUrl,
    apiKey,
    apiSecret
  );
}

type CreateParticipantTokenOptions = {
  roomName: string;
  participantIdentity: string;
  participantName: string;
};

export async function createParticipantToken({
  roomName,
  participantIdentity,
  participantName,
}: CreateParticipantTokenOptions) {
  const {
    apiKey,
    apiSecret,
  } = getLiveKitCredentials();

  const accessToken = new AccessToken(
    apiKey,
    apiSecret,
    {
      identity: participantIdentity,
      name: participantName,

      // Short-lived token: valid for 10 minutes.
      ttl: "10m",

      metadata: JSON.stringify({
        participantType: "human",
      }),
    }
  );

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await accessToken.toJwt();
}
