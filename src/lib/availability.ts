import { supabase } from "./supabase";

export type RoomAvailability = {
  roomId: string;
  available: boolean;
  occupiedDates: { checkIn: string; checkOut: string }[];
};

/**
 * Check if a specific room is available for the given date range
 */
export async function checkRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("room_id", roomId)
      .neq("status", "cancelled")
      // Check for any overlapping bookings
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    if (error) {
      console.error("Availability check error:", error);
      return true; // Assume available on error
    }

    return !bookings || bookings.length === 0;
  } catch (err) {
    console.error("Room availability check failed:", err);
    return true; // Assume available on error
  }
}

/**
 * Get all available rooms for a date range
 */
export async function getAvailableRooms(
  checkIn: string,
  checkOut: string
): Promise<string[]> {
  try {
    // Get all unique room IDs from bookings
    const { data: allBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("room_id, check_in, check_out")
      .neq("status", "cancelled");

    if (bookingError) throw bookingError;

    // Get all possible room IDs (from data.ts)
    // For now, we'll assume room-1 through room-5 based on your existing bookings
    const allRoomIds = [
      "room-1",
      "room-2",
      "room-3",
      "room-4",
      "room-5",
    ];

    // Filter out rooms that have conflicts
    const occupiedRooms = new Set<string>();

    for (const booking of allBookings || []) {
      // Check if this booking overlaps with our desired dates
      const bookingCheckIn = new Date(booking.check_in).getTime();
      const bookingCheckOut = new Date(booking.check_out).getTime();
      const desiredCheckIn = new Date(checkIn).getTime();
      const desiredCheckOut = new Date(checkOut).getTime();

      if (
        bookingCheckIn < desiredCheckOut &&
        bookingCheckOut > desiredCheckIn
      ) {
        occupiedRooms.add(booking.room_id);
      }
    }

    return allRoomIds.filter((room) => !occupiedRooms.has(room));
  } catch (err) {
    console.error("Failed to get available rooms:", err);
    return [];
  }
}

/**
 * Get occupancy rate for a room during a date range
 */
export async function getRoomOccupancyRate(
  roomId: string,
  fromDate: string,
  toDate: string
): Promise<number> {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("room_id", roomId)
      .eq("status", "confirmed")
      .lt("check_out", toDate)
      .gt("check_in", fromDate);

    if (error) throw error;

    if (!bookings || bookings.length === 0) return 0;

    const startDate = new Date(fromDate).getTime();
    const endDate = new Date(toDate).getTime();
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    let occupiedDays = 0;

    for (const booking of bookings) {
      const bookingStart = Math.max(
        new Date(booking.check_in).getTime(),
        startDate
      );
      const bookingEnd = Math.min(
        new Date(booking.check_out).getTime(),
        endDate
      );
      const daysOccupied = Math.ceil(
        (bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)
      );
      occupiedDays += daysOccupied;
    }

    return Math.round((occupiedDays / totalDays) * 100);
  } catch (err) {
    console.error("Occupancy rate calculation error:", err);
    return 0;
  }
}

/**
 * Get next available check-in date for a room (for informed guests)
 */
export async function getNextAvailableDate(
  roomId: string,
  fromDate: string
): Promise<string | null> {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_out")
      .eq("room_id", roomId)
      .neq("status", "cancelled")
      .gte("check_out", fromDate)
      .order("check_out", { ascending: true })
      .limit(1);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return fromDate; // Available from requested date
    }

    return bookings[0].check_out;
  } catch (err) {
    console.error("Next available date check error:", err);
    return null;
  }
}
