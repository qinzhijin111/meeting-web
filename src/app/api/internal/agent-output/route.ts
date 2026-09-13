
import {
  timingSafeEqual,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


const ActionItemSchema =
  z
    .object({
      description:
        z.string()
          .min(1)
          .max(1000),

      owner:
        z.string()
          .max(200)
          .nullable()
          .optional(),

      dueDate:
        z.string()
          .max(200)
          .nullable()
          .optional(),
    })
    .strict();


const NotesSchema =
  z
    .object({
      summary:
        z.string()
          .min(1)
          .max(10000),

      decisions:
        z.array(
          z.string()
            .max(2000),
        )
        .max(100),

      actionItems:
        z.array(
          ActionItemSchema,
        )
        .max(100),

      openQuestions:
        z.array(
          z.string()
            .max(2000),
        )
        .max(100),
    })
    .strict();


const PayloadSchema =
  z
    .object({
      roomId:
        z.string().uuid(),

      agentSessionId:
        z.string().uuid(),

      status:
        z.enum([
          "waiting",
          "processing",
          "ready",
          "partial",
          "error",
        ]),

      notes:
        NotesSchema.optional(),

      errorMessage:
        z.string()
          .max(4000)
          .nullable()
          .optional(),
    })
    .strict();


function hasValidWorkerSecret(
  request: Request,
): boolean {
  const expected =
    process.env
      .AGENT_WORKER_SHARED_SECRET;

  if (!expected) {
    console.error(
      "AGENT_WORKER_SHARED_SECRET "
      + "is not configured."
    );

    return false;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization
    || !authorization
      .startsWith(
        "Bearer "
      )
  ) {
    return false;
  }

  const provided =
    authorization.slice(
      "Bearer ".length
    );

  const expectedBuffer =
    Buffer.from(expected);

  const providedBuffer =
    Buffer.from(provided);

  if (
    expectedBuffer.length
    !== providedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    providedBuffer,
  );
}


export async function POST(
  request: Request,
) {
  // -------------------------------------------
  // 1. Authenticate worker
  // -------------------------------------------

  if (
    !hasValidWorkerSecret(
      request
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized worker.",
      },
      {
        status: 401,
      },
    );
  }

  // -------------------------------------------
  // 2. Parse JSON
  // -------------------------------------------

  let json: unknown;

  try {
    json =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  // -------------------------------------------
  // 3. Validate schema
  // -------------------------------------------

  const parsed =
    PayloadSchema.safeParse(
      json
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid agent output.",
      },
      {
        status: 400,
      },
    );
  }

  const body =
    parsed.data;

  if (
    body.status === "ready"
    && !body.notes
  ) {
    return NextResponse.json(
      {
        error:
          "Ready output requires notes.",
      },
      {
        status: 400,
      },
    );
  }

  const admin =
    createAdminClient();

  // -------------------------------------------
  // 4. Verify room_agents relationship
  // -------------------------------------------

  const {
    data: agentSession,
    error: agentError,
  } = await admin
    .from("room_agents")
    .select(
      `
        id,
        room_id,
        agent_type
      `,
    )
    .eq(
      "id",
      body.agentSessionId,
    )
    .eq(
      "room_id",
      body.roomId,
    )
    .maybeSingle();

  if (
    agentError
    || !agentSession
    || agentSession.agent_type
      !== "notes"
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid agent session.",
      },
      {
        status: 403,
      },
    );
  }

  // -------------------------------------------
  // 5. Build DB row
  // -------------------------------------------

  const row: Record<
    string,
    unknown
  > = {
    room_id:
      body.roomId,

    agent_session_id:
      body.agentSessionId,

    status:
      body.status,

    error_message:
      body.errorMessage
      ?? null,

    updated_at:
      new Date()
        .toISOString(),
  };

  if (body.notes) {
    row.summary =
      body.notes.summary;

    row.decisions_json =
      body.notes.decisions;

    row.action_items_json =
      body.notes.actionItems;

    row.open_questions_json =
      body.notes.openQuestions;
  }

  // -------------------------------------------
  // 6. Upsert output
  // -------------------------------------------

  const {
    data: saved,
    error: saveError,
  } = await admin
    .from("meeting_notes")
    .upsert(
      row,
      {
        onConflict:
          "agent_session_id",
      },
    )
    .select(
      `
        id,
        room_id,
        agent_session_id,
        status,
        updated_at
      `,
    )
    .single();

  if (
    saveError
    || !saved
  ) {
    console.error(
      "Failed to persist "
      + "meeting notes:",
      saveError,
    );

    return NextResponse.json(
      {
        error:
          "Failed to persist notes.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    output: saved,
  });
}
