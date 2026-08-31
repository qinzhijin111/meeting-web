
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title");

  if (typeof title !== "string" || title.trim().length === 0) {
    redirect("/dashboard?error=room_title_required");
  }

  if (title.trim().length > 80) {
    redirect("/dashboard?error=room_title_too_long");
  }

  const { error } = await supabase.from("rooms").insert({
    title: title.trim(),
    host_user_id: user.id,
    status: "draft",
  });

  if (error) {
    console.error("Failed to create room:", error);
    redirect("/dashboard?error=room_creation_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?success=room_created");
}
