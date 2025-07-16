import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClientFromJwt, getUser } from "@/lib/supabase/server/client";
import {
  AuthenticationError,
  ValidationError,
  handleApiError,
} from "@/lib/utils/errors";
import { decrypt } from "@/lib/utils/encryption";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

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
      throw new ValidationError(
        "OpenAI API key not found. Please set your API key first."
      );
    }

    const encryptedData = JSON.parse(userData.openai_api_key);
    const apiKey = decrypt(encryptedData);

    const { label, messages, prompt } = await req.json();

    const openai = new OpenAI({ apiKey });

    console.log("Prompt: ", prompt);
    console.log("Messages: ", messages);

    // Analyze the conversation with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        ...messages,
      ],
      temperature: 0,
      max_tokens: 5,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    console.log("Content: ", content);
    const negativityScore = parseFloat(content);
    if (isNaN(negativityScore)) {
      console.log(`Invalid score from OpenAI: ${content}`);
      throw new Error(`Invalid score from OpenAI: ${content}`);
    }

    console.log(`${label}: ${negativityScore}`);
    return NextResponse.json({ score: negativityScore });
  } catch (error) {
    console.error("Server error:", error);
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
}
