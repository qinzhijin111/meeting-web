
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { createRoom } from "./actions";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, title, status, created_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="mb-6 text-center text-sm text-gray-500">
          Welcome to AgentMeet
        </p>

        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Signed in as
          </p>

          <p className="mt-1 font-medium text-gray-800">
            {user.email}
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Create Room
          </h2>

          {params.error === "room_title_required" && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Room title is required.
            </div>
          )}

          {params.error === "room_title_too_long" && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Room title must be 80 characters or fewer.
            </div>
          )}

          {params.error === "room_creation_failed" && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Unable to create room. Please try again.
            </div>
          )}

          {params.success === "room_created" && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
              Room created successfully.
            </div>
          )}

          <form action={createRoom} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Room title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="Enter room title"
                required
                maxLength={80}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
               htmlFor="password"
               className="mb-1 block text-sm font-medium text-gray-700"
              >
               Room password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter room password"
                required
                minLength={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>


            <button
              type="submit"
              className="w-full rounded-md bg-green-600 py-2 font-medium text-white hover:bg-green-700"
            >
              Create Room
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Recent Rooms
          </h2>

          {rooms && rooms.length > 0 ? (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="font-medium text-gray-800">
                    {room.title}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Status: {room.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No rooms created yet.
            </p>
          )}
        </div>

        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
          >
            Logout
          </button>
        </form>
      </div>
    </main>
  );
}
