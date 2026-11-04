import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid signup request." }, { status: 400 });
    }

    const { email, password, firstName, lastName, phone } = body as {
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      phone?: unknown;
    };

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain both letters and numbers." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: typeof firstName === "string" ? firstName : "",
          last_name: typeof lastName === "string" ? lastName : "",
          phone: typeof phone === "string" ? phone : "",
        },
      },
    });

    if (error) {
      console.error("Signup failed", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "User created successfully", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup request failed", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
