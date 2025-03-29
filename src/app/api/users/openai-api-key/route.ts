import { NextResponse } from "next/server";

import { encrypt } from "@/lib/utils/encryption";
import { createClientFromJwt, getUser } from "@/lib/supabase/server/client";
import {
  AuthenticationError,
  ValidationError,
  handleApiError,
} from "@/lib/utils/errors";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const jwt = authHeader.split(" ")[1];
    const supabase = await createClientFromJwt(jwt);

    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    const user = await getUser(supabase);

    if (!user) {
      throw new AuthenticationError("Invalid or expired token");
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      throw new ValidationError("API key is required");
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
      throw new Error("Failed to update API key");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
}
