/**
 * dynamic-data.ts
 * 
 * Fetches live prices and images from Supabase and merges them
 * with the static data in data.ts.
 * 
 * Usage in any page/component:
 *   import { getDynamicRooms } from "@/lib/dynamic-data";
 *   const rooms = await getDynamicRooms();
 */

import { supabase } from "./supabase";
import { rooms as staticRooms, type RoomItem } from "./data";

// Maps Supabase room ID → static room ID
// Adjust these if your IDs differ
const ROOM_ID_MAP: Record<string, string> = {
  lux:      "luxury",
  delux:    "halflux",
  standard: "std2",
  ger2:     "std4",
  ger5:     "std5",
  gerpack:  "summer",
};

export async function getDynamicRooms(): Promise<RoomItem[]> {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, adult1, adult2, child02, img");

    if (error || !data) return staticRooms;

    // Merge live prices/images into static room data
    return staticRooms.map(room => {
      // Find matching Supabase row
      const supabaseId = Object.entries(ROOM_ID_MAP).find(([, v]) => v === room.id)?.[0];
      const live = data.find(d => d.id === supabaseId);
      if (!live) return room;

      return {
        ...room,
        adult1:  live.adult1  ?? room.adult1,
        adult2:  live.adult2  ?? room.adult2,
        child02: live.child02 ?? room.child02,
        img:     live.img && live.img.trim() !== "" ? live.img : room.img,
      };
    });
  } catch {
    // If Supabase fails, fall back to static data silently
    return staticRooms;
  }
}


