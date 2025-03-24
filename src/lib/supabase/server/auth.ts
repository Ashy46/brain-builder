import { SupabaseClient } from "@supabase/supabase-js";

import { getUserId } from "./server";

export async function checkAuth(supabase: SupabaseClient): Promise<boolean> {
  console.log("Checking auth...");

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error checking auth:", error.message);
    return false;
  }

  console.log("Session state:", {
    hasSession: !!session,
    sessionExpiresAt: session?.expires_at,
    sessionUser: session?.user?.email,
  });

  return !!session;
}

export async function checkRole(
  supabase: SupabaseClient,
  roles: string[]
): Promise<boolean> {
  const userId = await getUserId(supabase);
  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking role:", error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.error("No roles found for user");
    return false;
  }

  const userRoles = data.flatMap((entry) => {
    if (Array.isArray(entry.roles)) {
      return entry.roles.map((role) => role.name);
    } else if (entry.roles && typeof entry.roles === "object") {
      return [(entry.roles as { name: string }).name];
    }
    return [];
  });

  console.log("User roles fetched:", userRoles);

  const hasExactRole = roles.some((requiredRole) =>
    userRoles.includes(requiredRole)
  );

  if (hasExactRole) {
    console.log("User has the exact required role:", roles);
    return true;
  } else {
    console.error("User does not have any of the required roles:", roles);
    return false;
  }
}

export async function checkAllRoles(
  supabase: SupabaseClient,
  roles: string[]
): Promise<boolean> {
  type UserRoleEntry = {
    roles: { name: string } | { name: string }[];
  };

  const userId = await getUserId(supabase);
  if (!userId) {
    console.error("User is not logged in");
    return false;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking roles:", error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.error("No roles found for user");
    return false;
  }

  const userRoles = data.flatMap((entry: UserRoleEntry) => {
    const rolesField = entry.roles;
    if (Array.isArray(rolesField)) {
      return rolesField.map((role) => role.name);
    } else if (
      rolesField &&
      typeof rolesField === "object" &&
      "name" in rolesField
    ) {
      return [rolesField.name];
    }
    return [];
  });
  console.log("User roles:", userRoles);

  const hasAllRoles = roles.every((requiredRole) =>
    userRoles.includes(requiredRole)
  );

  if (hasAllRoles) {
    console.log("User has all the required roles");
    return true;
  } else {
    console.error("User does not have all the required roles");
    return false;
  }
}
