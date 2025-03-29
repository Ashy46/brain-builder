import { NextResponse } from "next/server";

import { encrypt } from "@/lib/utils/encryption";
import { createClientFromJwt, getUser } from "@/lib/supabase/server/client";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const jwt = authHeader.split(" ")[1];
    const supabase = await createClientFromJwt(jwt);
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to create Supabase client" },
        { status: 500 }
      );
    }

    const user = await getUser(supabase);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const encryptedKey = encrypt(apiKey);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        openai_api_key: JSON.stringify(encryptedKey),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in API key update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
