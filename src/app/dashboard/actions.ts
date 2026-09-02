
"use server";

import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { createRoomServiceClient } from "@/lib/livekit/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User must be authenticated before creating a room.
  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title");
  const password = formData.get("password");

  // Validate room title.
  if (typeof title !== "string" || title.trim().length === 0) {
    redirect("/dashboard?error=room_title_required");
  }

  if (title.trim().length > 80) {
    redirect("/dashboard?error=room_title_too_long");
  }

  // Validate room password.
  if (
    typeof password !== "string" ||
    password.length < 6
  ) {
    redirect("/dashboard?error=room_password_invalid");
  }

  // Hash the password before storing it in the database.
  const passwordHash = await bcrypt.hash(password, 10);

  // Public ID used in the shareable room URL.
  const publicRoomId = crypto.randomUUID();

  // Internal LiveKit room name.
  const livekitRoomName = `room_${crypto.randomUUID()}`;

  const roomService = createRoomServiceClient();

  try {
    // Create the actual LiveKit room.
    await roomService.createRoom({
      name: livekitRoomName,
      maxParticipants: 8,
      emptyTimeout: 10 * 60,
    });
  } catch (error) {
    console.error("Failed to create LiveKit room:", error);

    redirect(
      "/dashboard?error=livekit_room_creation_failed"
    );
  }

  // Save the room information in Supabase.
  const { error: databaseError } = await supabase
    .from("rooms")
    .insert({
      title: title.trim(),
      host_user_id: user.id,
      password_hash: passwordHash,
      livekit_room_name: livekitRoomName,
      public_id: publicRoomId,
      status: "draft",
    });

  if (databaseError) {
    console.error(
      "Failed to save room to database:",
      databaseError
    );

    // Best-effort cleanup:
    // if the database insert fails, remove the LiveKit room
    // so we do not leave an orphan room behind.
    try {
      await roomService.deleteRoom(livekitRoomName);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up LiveKit room:",
        cleanupError
      );
    }

    redirect("/dashboard?error=room_creation_failed");
  }

  revalidatePath("/dashboard");

  redirect("/dashboard?success=room_created");
}
