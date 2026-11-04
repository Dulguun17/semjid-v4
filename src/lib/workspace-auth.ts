import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type WorkspaceRole = "customer" | "staff" | "ceo";

type WorkspaceAccessResult =
  | { allowed: true; role: WorkspaceRole; isManager: boolean }
  | { allowed: false; response: NextResponse };

const isWorkspaceRole = (value: unknown): value is WorkspaceRole =>
  value === "customer" || value === "staff" || value === "ceo";

export function createWorkspaceUserClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) throw new Error("Authentication required");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export async function requireWorkspaceAccess(
  request: Request,
  options: { roles: WorkspaceRole[]; managerOnly?: boolean }
): Promise<WorkspaceAccessResult> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return {
        allowed: false,
        response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
      };
    }

    const { data: roleValue, error: roleError } = await supabase.rpc("get_workspace_role");
    if (roleError || !isWorkspaceRole(roleValue)) {
      console.error("Workspace role lookup failed", roleError);
      return {
        allowed: false,
        response: NextResponse.json({ error: "Unable to verify workspace access" }, { status: 503 }),
      };
    }

    const { data: managerValue, error: managerError } = await supabase.rpc("is_workspace_manager");
    if (managerError || typeof managerValue !== "boolean") {
      console.error("Workspace manager lookup failed", managerError);
      return {
        allowed: false,
        response: NextResponse.json({ error: "Unable to verify workspace access" }, { status: 503 }),
      };
    }

    if (!options.roles.includes(roleValue)) {
      return {
        allowed: false,
        response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
      };
    }

    if (options.managerOnly && !managerValue) {
      return {
        allowed: false,
        response: NextResponse.json({ error: "Manager access required" }, { status: 403 }),
      };
    }

    return { allowed: true, role: roleValue, isManager: managerValue };
  } catch (error) {
    console.error("Workspace permission verification failed", error);
    return {
      allowed: false,
      response: NextResponse.json({ error: "Unable to verify workspace access" }, { status: 503 }),
    };
  }
}
