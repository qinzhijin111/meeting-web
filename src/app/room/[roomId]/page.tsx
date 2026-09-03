
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinLobby from "@/components/meeting/JoinLobby";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function RoomPage({
  params,
}: RoomPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { roomId } = await params;

  return (
    <JoinLobby roomId={roomId} />
  );
}
