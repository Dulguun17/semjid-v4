"use client";

import { supabase } from "@/lib/supabase";

export async function workspaceAuthorizationHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Please sign in again to continue.");
  return { Authorization: `Bearer ${data.session.access_token}` };
}
