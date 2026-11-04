import { rooms as roomDescriptions, type RoomItem } from "./data";

type RoomCatalogueRow = {
  id: string;
  capacity: number;
  adult1: number | null;
  adult2: number | null;
  child02: number | null;
  child37a: number | null;
  child37b: number | null;
  child812a: number | null;
  child812b: number | null;
  img: string | null;
  unit_count: number;
};

export async function getDynamicRooms(): Promise<RoomItem[]> {
  const response = await fetch("/api/rooms", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Room catalogue is unavailable.");

  const rows = result.rooms as RoomCatalogueRow[];
  return rows.flatMap(row => {
    const description = roomDescriptions.find(room => room.id === row.id);
    if (!description) return [];
    return [{
      ...description,
      capacity: row.capacity,
      totalRooms: row.unit_count,
      adult1: row.adult1,
      adult2: row.adult2,
      child02: row.child02,
      child37a: row.child37a,
      child37b: row.child37b,
      child812a: row.child812a,
      child812b: row.child812b,
      img: row.img || description.img,
    }];
  });
}
