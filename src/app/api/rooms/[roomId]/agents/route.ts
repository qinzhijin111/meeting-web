
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAgentDispatchClient } from "@/lib/livekit/server";


type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};


type AgentType =
  | "notes"
  | "assistant"
  | "translator";


const AGENT_DISPATCH_NAME =
  "agentmeet-agent";


const ACTIVE_AGENT_STATUSES = [
  "starting",
  "dispatched",
  "running",
  "stopping",
];


function isAgentType(
  value: unknown,
): value is AgentType {
  return (
    value === "notes" ||
    value === "assistant" ||
    value === "translator"
  );
}


/*
 * GET
 *
 * Returns current agent state for the
 * host-only Agents panel.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    // ---------------------------------------------
    // 1. Authenticate
    // ---------------------------------------------

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
          code:
            "UNAUTHENTICATED",
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

    // ---------------------------------------------
    // 2. Verify room and host
    // ---------------------------------------------

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
          status
        `,
      )
      .eq(
        "public_id",
        roomId,
      )
      .maybeSingle();

    if (
      roomError ||
      !room ||
      room.host_user_id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to manage agents in this room.",
          code:
            "FORBIDDEN",
        },
        {
          status: 403,
        },
      );
    }

    // ---------------------------------------------
    // 3. Load agent state
    // ---------------------------------------------

    const {
      data: agents,
      error: agentsError,
    } = await admin
      .from("room_agents")
      .select(
        `
          id,
          agent_type,
          dispatch_id,
          participant_identity,
          status,
          created_at,
          updated_at,
          stopped_at
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
      );

    if (agentsError) {
      console.error(
        "Failed to query room agents:",
        agentsError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load agent status.",
          code:
            "AGENTS_QUERY_FAILED",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      agents: agents ?? [],
    });
  } catch (error) {
    console.error(
      "Unexpected agents GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load agents.",
        code:
          "INTERNAL_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}


/*
 * POST
 *
 * Starts a named agent using
 * LiveKit explicit dispatch.
 */
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    // ---------------------------------------------
    // 1. Authenticate
    // ---------------------------------------------

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
          code:
            "UNAUTHENTICATED",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------
    // 2. Validate request body
    // ---------------------------------------------

    let body: {
      agentType?: unknown;
    };

    try {
      body =
        (await request.json()) as {
          agentType?: unknown;
        };
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
          code:
            "INVALID_INPUT",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isAgentType(
        body.agentType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported agent type.",
          code:
            "INVALID_AGENT_TYPE",
        },
        {
          status: 400,
        },
      );
    }

    const agentType =
      body.agentType;

    const { roomId } =
      await params;

    const admin =
      createAdminClient();

    // ---------------------------------------------
    // 3. Load room and verify HOST
    // ---------------------------------------------

    const {
      data: room,
      error: roomError,
    } = await admin
      .from("rooms")
      .select(
        `
          id,
          public_id,
          livekit_room_name,
          host_user_id,
          status
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
            "Unable to start an agent.",
          code:
            "AGENT_START_DENIED",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Never trust an isHost flag from
     * the browser.
     *
     * The authenticated user's ID is
     * checked against rooms.host_user_id.
     */
    if (
      room.host_user_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Only the room host can start agents.",
          code:
            "HOST_ONLY",
        },
        {
          status: 403,
        },
      );
    }

    if (
      room.status !== "active" ||
      !room.livekit_room_name
    ) {
      return NextResponse.json(
        {
          error:
            "Agents can only be started in an active meeting.",
          code:
            "ROOM_NOT_ACTIVE",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------
    // 4. Check agent capacity
    // ---------------------------------------------

    const {
      data: activeAgents,
      error: activeError,
    } = await admin
      .from("room_agents")
      .select(
        "id, agent_type, status",
      )
      .eq(
        "room_id",
        room.id,
      )
      .in(
        "status",
        ACTIVE_AGENT_STATUSES,
      );

    if (activeError) {
      console.error(
        "Failed to check active agents:",
        activeError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check agent capacity.",
          code:
            "AGENT_STATE_ERROR",
        },
        {
          status: 500,
        },
      );
    }

    const sameAgentActive =
      activeAgents?.some(
        (agent) =>
          agent.agent_type ===
          agentType,
      ) ?? false;

    if (sameAgentActive) {
      return NextResponse.json(
        {
          error:
            "This agent is already active or starting.",
          code:
            "AGENT_ALREADY_ACTIVE",
        },
        {
          status: 409,
        },
      );
    }

    if (
      (activeAgents?.length ?? 0)
      >= 3
    ) {
      return NextResponse.json(
        {
          error:
            "This room already has the maximum number of active agents.",
          code:
            "AGENT_CAPACITY_FULL",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------
    // 5. Reserve room_agents row BEFORE dispatch
    // ---------------------------------------------

    /*
     * This row is important for Week 6.
     *
     * reservedAgent.id becomes the
     * agent_session_id sent to the worker.
     *
     * Meeting notes will later reference
     * exactly this room_agents row.
     */

    const now =
      new Date().toISOString();

    const {
      data: reservedAgent,
      error: reserveError,
    } = await admin
      .from("room_agents")
      .insert({
        room_id:
          room.id,

        agent_type:
          agentType,

        status:
          "starting",

        settings_json:
          {},

        started_by:
          user.id,

        updated_at:
          now,
      })
      .select(
        `
          id,
          agent_type,
          status,
          dispatch_id,
          created_at,
          updated_at
        `,
      )
      .single();

    /*
     * PostgreSQL unique violation.
     *
     * The database partial unique index
     * protects against simultaneous
     * double-click Start requests.
     */
    if (
      reserveError?.code ===
      "23505"
    ) {
      return NextResponse.json(
        {
          error:
            "This agent is already active or starting.",
          code:
            "AGENT_ALREADY_ACTIVE",
        },
        {
          status: 409,
        },
      );
    }

    if (
      reserveError ||
      !reservedAgent
    ) {
      console.error(
        "Failed to reserve room agent:",
        reserveError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to start the agent.",
          code:
            "AGENT_RESERVATION_FAILED",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------
    // 6. Build worker metadata
    // ---------------------------------------------

    /*
     * IMPORTANT FOR WEEK 6:
     *
     * agent_session_id is the UUID of
     * this specific room_agents row.
     *
     * Python AgentJobMetadata now requires:
     *
     * room_id
     * room_name
     * agent_session_id
     * agent_type
     * started_by
     * settings
     */
    const metadata =
      JSON.stringify({
        room_id:
          room.id,

        room_name:
          room.livekit_room_name,

        agent_session_id:
          reservedAgent.id,

        agent_type:
          agentType,

        started_by:
          user.id,

        settings:
          {},
      });

    // ---------------------------------------------
    // 7. Create explicit LiveKit dispatch
    // ---------------------------------------------

    const dispatchClient =
      createAgentDispatchClient();

    try {
      const dispatch =
        await dispatchClient.createDispatch(
          room.livekit_room_name,
          AGENT_DISPATCH_NAME,
          {
            metadata,
          },
        );

      // -------------------------------------------
      // 8. Persist successful dispatch
      // -------------------------------------------

      const {
        data: updatedAgent,
        error: updateError,
      } = await admin
        .from("room_agents")
        .update({
          dispatch_id:
            dispatch.id,

          status:
            "dispatched",

          updated_at:
            new Date()
              .toISOString(),

          error_message:
            null,
        })
        .eq(
          "id",
          reservedAgent.id,
        )
        .select(
          `
            id,
            agent_type,
            dispatch_id,
            status,
            created_at,
            updated_at
          `,
        )
        .single();

      /*
       * LiveKit may accept the dispatch
       * while our DB update fails.
       *
       * In that case, best-effort remove
       * the LiveKit dispatch so the two
       * systems do not intentionally drift.
       */
      if (
        updateError ||
        !updatedAgent
      ) {
        console.error(
          "Failed to persist dispatch:",
          updateError,
        );

        try {
          await dispatchClient
            .deleteDispatch(
              dispatch.id,
              room.livekit_room_name,
            );
        } catch (cleanupError) {
          console.error(
            "Failed to clean up LiveKit dispatch:",
            cleanupError,
          );
        }

        await admin
          .from("room_agents")
          .update({
            status:
              "failed",

            error_message:
              "Failed to persist dispatch state.",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            reservedAgent.id,
          );

        return NextResponse.json(
          {
            error:
              "Unable to persist agent state.",
            code:
              "AGENT_STATE_ERROR",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json(
        {
          agent:
            updatedAgent,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      console.error(
        "LiveKit agent dispatch failed:",
        error,
      );

      /*
       * A failed row does not match the
       * active-agent partial unique index,
       * so the host can retry later.
       */
      await admin
        .from("room_agents")
        .update({
          status:
            "failed",

          error_message:
            "LiveKit dispatch failed.",

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          reservedAgent.id,
        );

      return NextResponse.json(
        {
          error:
            "The agent could not be dispatched.",
          code:
            "AGENT_DISPATCH_FAILED",
        },
        {
          status: 503,
        },
      );
    }
  } catch (error) {
    console.error(
      "Unexpected start-agent API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting the agent.",
        code:
          "INTERNAL_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}


/*
 * DELETE
 *
 * Stops an active agent by deleting its
 * LiveKit explicit dispatch.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    // ---------------------------------------------
    // 1. Authenticate
    // ---------------------------------------------

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
          code:
            "UNAUTHENTICATED",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------
    // 2. Validate request body
    // ---------------------------------------------

    let body: {
      agentType?: unknown;
    };

    try {
      body =
        (await request.json()) as {
          agentType?: unknown;
        };
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
          code:
            "INVALID_INPUT",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isAgentType(
        body.agentType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported agent type.",
          code:
            "INVALID_AGENT_TYPE",
        },
        {
          status: 400,
        },
      );
    }

    const agentType =
      body.agentType;

    const { roomId } =
      await params;

    const admin =
      createAdminClient();

    // ---------------------------------------------
    // 3. Verify room and HOST
    // ---------------------------------------------

    const {
      data: room,
      error: roomError,
    } = await admin
      .from("rooms")
      .select(
        `
          id,
          public_id,
          livekit_room_name,
          host_user_id,
          status
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
            "Unable to stop the agent.",
          code:
            "AGENT_STOP_DENIED",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Never trust the browser's isHost flag.
     * Authorize again on the server.
     */
    if (
      room.host_user_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Only the room host can stop agents.",
          code:
            "HOST_ONLY",
        },
        {
          status: 403,
        },
      );
    }

    if (
      !room.livekit_room_name
    ) {
      return NextResponse.json(
        {
          error:
            "The meeting does not have a LiveKit room.",
          code:
            "LIVEKIT_ROOM_MISSING",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------
    // 4. Find active agent session
    // ---------------------------------------------

    const {
      data: activeAgent,
      error: activeAgentError,
    } = await admin
      .from("room_agents")
      .select(
        `
          id,
          agent_type,
          dispatch_id,
          status,
          participant_identity
        `,
      )
      .eq(
        "room_id",
        room.id,
      )
      .eq(
        "agent_type",
        agentType,
      )
      .in(
        "status",
        ACTIVE_AGENT_STATUSES,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (activeAgentError) {
      console.error(
        "Failed to query active agent:",
        activeAgentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check agent state.",
          code:
            "AGENT_STATE_ERROR",
        },
        {
          status: 500,
        },
      );
    }

    if (!activeAgent) {
      return NextResponse.json(
        {
          error:
            "This agent is not active.",
          code:
            "AGENT_NOT_ACTIVE",
        },
        {
          status: 404,
        },
      );
    }

    if (
      activeAgent.status ===
      "stopping"
    ) {
      return NextResponse.json(
        {
          error:
            "This agent is already stopping.",
          code:
            "AGENT_ALREADY_STOPPING",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * A "starting" row may not yet have
     * received its LiveKit dispatch ID.
     */
    if (
      !activeAgent.dispatch_id
    ) {
      return NextResponse.json(
        {
          error:
            "The agent is still starting. Try again shortly.",
          code:
            "AGENT_NOT_READY_TO_STOP",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------
    // 5. Reserve stop operation
    // ---------------------------------------------

    const {
      error: stoppingError,
    } = await admin
      .from("room_agents")
      .update({
        status:
          "stopping",

        updated_at:
          new Date()
            .toISOString(),

        error_message:
          null,
      })
      .eq(
        "id",
        activeAgent.id,
      );

    if (stoppingError) {
      console.error(
        "Failed to mark agent as stopping:",
        stoppingError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to stop the agent.",
          code:
            "AGENT_STATE_ERROR",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------
    // 6. Delete LiveKit explicit dispatch
    // ---------------------------------------------

    const dispatchClient =
      createAgentDispatchClient();

    try {
      await dispatchClient
        .deleteDispatch(
          activeAgent.dispatch_id,
          room.livekit_room_name,
        );
    } catch (error) {
      console.error(
        "LiveKit agent stop failed:",
        error,
      );

      /*
       * Restore previous state so the host
       * can retry.
       */
      await admin
        .from("room_agents")
        .update({
          status:
            activeAgent.status,

          error_message:
            "LiveKit dispatch deletion failed.",

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          activeAgent.id,
        );

      return NextResponse.json(
        {
          error:
            "The agent could not be stopped.",
          code:
            "AGENT_STOP_FAILED",
        },
        {
          status: 503,
        },
      );
    }

    // ---------------------------------------------
    // 7. Persist stopped state
    // ---------------------------------------------

    const stoppedAt =
      new Date().toISOString();

    const {
      data: stoppedAgent,
      error: stoppedError,
    } = await admin
      .from("room_agents")
      .update({
        status:
          "stopped",

        stopped_at:
          stoppedAt,

        updated_at:
          stoppedAt,

        error_message:
          null,
      })
      .eq(
        "id",
        activeAgent.id,
      )
      .select(
        `
          id,
          agent_type,
          dispatch_id,
          participant_identity,
          status,
          created_at,
          updated_at,
          stopped_at
        `,
      )
      .single();

    if (
      stoppedError ||
      !stoppedAgent
    ) {
      console.error(
        "Agent stopped in LiveKit but DB update failed:",
        stoppedError,
      );

      return NextResponse.json(
        {
          error:
            "Agent stopped, but its database state could not be updated.",
          code:
            "AGENT_STOP_STATE_ERROR",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      agent:
        stoppedAgent,
    });
  } catch (error) {
    console.error(
      "Unexpected stop-agent API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while stopping the agent.",
        code:
          "INTERNAL_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}
