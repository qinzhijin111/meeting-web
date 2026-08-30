
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

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
