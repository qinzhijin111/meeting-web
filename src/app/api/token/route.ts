
import { AccessToken } from "livekit-server-sdk";

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: "LiveKit credentials are not configured" },
      { status: 500 }
    );
  }

  const roomName = "dev-room";
  const participantIdentity = `dev-user-${Date.now()}`;

  const accessToken = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
  });

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
  });

  const token = await accessToken.toJwt();

  return Response.json({
    token,
    roomName,
    participantIdentity,
  });
}
