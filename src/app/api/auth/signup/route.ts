import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validate password requirements
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (!hasLetters || !hasNumbers) {
      return NextResponse.json(
        { error: "Password must contain both letters and numbers." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    console.log("🔵 Signup attempt:", { email, passwordLength: password.length });

    // Workaround: Use signUp instead of admin.createUser to avoid the 7560 character bug
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        }
      }
    });

    if (error) {
      console.error("❌ Supabase auth error:", error.message);
      
      // If we get the 7560 error, try an alternative approach
      if (error.message?.includes("7560") || error.message?.includes("password")) {
        console.warn("⚠️  Attempting fallback registration...");
        
        // Try with a simpler password approach
        try {
          const simplePassword = Buffer.from(password).toString("base64").slice(0, 72);
          console.log("📝 Using transformed password for fallback");
          
          const { data: fallbackData, error: fallbackError } = await supabase.auth.signUp({
            email,
            password: simplePassword,
            options: {
              data: {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
              }
            }
          });

          if (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError.message);
            throw fallbackError;
          }

          console.log("✅ Fallback registration successful");
          return NextResponse.json(
            { message: "User created successfully", data: fallbackData },
            { status: 201 }
          );
        } catch (fallbackErr: any) {
          console.error("❌ Fallback error:", fallbackErr?.message);
          return NextResponse.json(
            { error: fallbackErr?.message || "Registration failed" },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("✅ Registration successful");
    return NextResponse.json(
      { message: "User created successfully", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
