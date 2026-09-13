
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";


type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};


export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    // -----------------------------------------
    // 1. Authenticate
    // -----------------------------------------

    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        },
      );
    }

    const { roomId } =
      await params;

    const admin =
      createAdminClient();

    // -----------------------------------------
    // 2. Find room
    // -----------------------------------------

    const {
      data: room,
      error: roomError,
    } = await admin
      .from("rooms")
      .select(
        `
          id,
          public_id,
          host_user_id,
          title
        `,
      )
      .eq(
        "public_id",
        roomId,
      )
      .maybeSingle();

    if (
      roomError ||
      !room
    ) {
      return NextResponse.json(
        {
          error:
            "Meeting not found.",
        },
        {
          status: 404,
        },
      );
    }

    // -----------------------------------------
    // 3. Host-only notes for MVP
    // -----------------------------------------

    if (
      room.host_user_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to view these meeting notes.",
        },
        {
          status: 403,
        },
      );
    }

    // -----------------------------------------
    // 4. Load latest Note Taker output
    // -----------------------------------------

    const {
      data: notes,
      error: notesError,
    } = await admin
      .from("meeting_notes")
      .select(
        `
          id,
          room_id,
          agent_session_id,
          summary,
          decisions_json,
          action_items_json,
          open_questions_json,
          status,
          error_message,
          created_at,
          updated_at
        `,
      )
      .eq(
        "room_id",
        room.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (notesError) {
      console.error(
        "Failed to load meeting notes:",
        notesError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load meeting notes.",
        },
        {
          status: 500,
        },
      );
    }

    // -----------------------------------------
    // 5. No output yet = waiting
    // -----------------------------------------

    if (!notes) {
      return NextResponse.json({
        room: {
          publicId:
            room.public_id,
          title:
            room.title,
        },

        status:
          "waiting",

        notes:
          null,
      });
    }

    // -----------------------------------------
    // 6. Return safe UI shape
    // -----------------------------------------

    return NextResponse.json({
      room: {
        publicId:
          room.public_id,
        title:
          room.title,
      },

      status:
        notes.status,

      notes: {
        id:
          notes.id,

        summary:
          notes.summary ?? "",

        decisions:
          notes.decisions_json
          ?? [],

        actionItems:
          notes.action_items_json
          ?? [],

        openQuestions:
          notes.open_questions_json
          ?? [],

        errorMessage:
          notes.error_message,

        createdAt:
          notes.created_at,

        updatedAt:
          notes.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected meeting notes GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load meeting notes.",
      },
      {
        status: 500,
      },
    );
  }
}
