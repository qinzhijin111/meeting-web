
import { RoomServiceClient } from "livekit-server-sdk";

export function createRoomServiceClient() {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error("Missing LiveKit server environment variables.");
  }

  return new RoomServiceClient(
    livekitUrl,
    apiKey,
    apiSecret
  );
}
