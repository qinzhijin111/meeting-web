
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createParticipantToken,
  createRoomServiceClient,
} from "@/lib/livekit/server";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Verify authenticated user
    // --------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in to join a room.",
          code: "UNAUTHENTICATED",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------
    // 2. Read route parameter and request body
    // --------------------------------------------------

    const { roomId } = await params;

    const body = await request.json();

    const password = body.password;
    const displayName = body.displayName;

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      typeof displayName !== "string" ||
      displayName.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Display name and room password are required.",
          code: "INVALID_INPUT",
        },
        {
          status: 400,
        }
      );
    }

    if (displayName.trim().length > 80) {
      return NextResponse.json(
        {
          error: "Display name is too long.",
          code: "INVALID_INPUT",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 3. Find the room using the public room ID
    // --------------------------------------------------

    const admin = createAdminClient();

    const {
      data: room,
      error: roomError,
    } = await admin
      .from("rooms")
      .select(
        `
          id,
          public_id,
          password_hash,
          status,
          livekit_room_name
        `
      )
      .eq("public_id", roomId)
      .maybeSingle();

    if (roomError) {
      console.error(
        "Failed to query room:",
        roomError
      );

      return NextResponse.json(
        {
          error: "Unable to join this room.",
          code: "JOIN_FAILED",
        },
        {
          status: 500,
        }
      );
    }

    if (!room) {
      return NextResponse.json(
        {
          error: "Unable to join this room.",
          code: "JOIN_DENIED",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // 4. Validate room status
    // --------------------------------------------------

    if (room.status !== "active") {
      return NextResponse.json(
        {
          error: "Unable to join this room.",
          code: "JOIN_DENIED",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !room.password_hash ||
      !room.livekit_room_name
    ) {
      return NextResponse.json(
        {
          error: "Unable to join this room.",
          code: "JOIN_DENIED",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // 5. Validate room password
    // --------------------------------------------------

    const passwordMatches = await bcrypt.compare(
      password,
      room.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Unable to join this room.",
          code: "JOIN_DENIED",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // 6. Generate a deterministic human identity
    // --------------------------------------------------

    const participantIdentity =
      `human:${room.id}:${user.id}`;

    // --------------------------------------------------
    // 7. Check current human capacity
    // --------------------------------------------------

    const roomService = createRoomServiceClient();

    let participants;

    try {
      participants =
        await roomService.listParticipants(
          room.livekit_room_name
        );
    } catch (error) {
      console.error(
        "Failed to list LiveKit participants:",
        error
      );

      return NextResponse.json(
        {
          error:
            "The meeting room is currently unavailable.",
          code: "ROOM_UNAVAILABLE",
        },
        {
          status: 503,
        }
      );
    }

    const humanIdentityPrefix =
      `human:${room.id}:`;

    const activeHumanParticipants =
      participants.filter((participant) =>
        participant.identity.startsWith(
          humanIdentityPrefix
        )
      );

    const userAlreadyConnected =
      activeHumanParticipants.some(
        (participant) =>
          participant.identity ===
          participantIdentity
      );

    if (
      !userAlreadyConnected &&
      activeHumanParticipants.length >= 5
    ) {
      return NextResponse.json(
        {
          error:
            "This meeting already has the maximum of five human participants.",
          code: "ROOM_FULL",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // 8. Create short-lived LiveKit access token
    // --------------------------------------------------

    const token = await createParticipantToken({
      roomName: room.livekit_room_name,
      participantIdentity,
      participantName: displayName.trim(),
    });

    const serverUrl =
      process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!serverUrl) {
      console.error(
        "NEXT_PUBLIC_LIVEKIT_URL is missing."
      );

      return NextResponse.json(
        {
          error:
            "The meeting service is not configured.",
          code: "SERVER_CONFIGURATION_ERROR",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 9. Return only safe join information
    // --------------------------------------------------

    return NextResponse.json({
      token,
      serverUrl,
      participantIdentity,
    });
  } catch (error) {
    console.error(
      "Unexpected join API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while joining the room.",
        code: "INTERNAL_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}
