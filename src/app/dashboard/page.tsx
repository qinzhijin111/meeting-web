
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { createRoom } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

        <p className="mt-6 text-center text-sm text-gray-500">
          You are successfully logged in.
        </p>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Create Room
          </h2>

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

