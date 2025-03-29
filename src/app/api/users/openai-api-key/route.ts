import { NextResponse } from "next/server";

import { encrypt, decrypt } from "@/lib/utils/encryption";
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

export async function GET(request: Request) {
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

    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("openai_api_key")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching user:", fetchError);
      throw new Error("Failed to fetch API key");
    }

    if (!userData?.openai_api_key) {
      return NextResponse.json({ apiKey: null });
    }

    const encryptedData = JSON.parse(userData.openai_api_key);
    const decryptedKey = decrypt(encryptedData);

    return NextResponse.json({ apiKey: decryptedKey });
  } catch (error) {
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
}
