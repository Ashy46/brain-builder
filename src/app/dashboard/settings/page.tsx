import { createClient } from "@/lib/supabase/server/client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const jwt = session?.access_token;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-semibold">Testing Information</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This section is for testing purposes only. Your JWT token is displayed
          below.
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium">JWT Token</label>
            <div className="mt-1 rounded-md bg-muted p-2">
              <code className="text-sm break-all">
                {jwt || "No token found"}
              </code>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              To use this token in API requests, include it in the Authorization
              header:
            </p>
            <div className="mt-1 rounded-md bg-muted p-2">
              <code className="text-sm">
                Authorization: Bearer {jwt || "your-token-here"}
              </code>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
