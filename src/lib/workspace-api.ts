"use client";

import { supabase } from "@/lib/supabase";

export async function workspaceSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Please sign in again to continue.");
  return data.session;
}

export async function workspaceAuthorizationHeaders(): Promise<Record<string, string>> {
  const session = await workspaceSession();
  return { Authorization: `Bearer ${session.access_token}` };
}
