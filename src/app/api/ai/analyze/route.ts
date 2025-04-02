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

    const { messages, graphId, stateId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("Messages array is required and cannot be empty");
    }

    if (!stateId) {
      throw new ValidationError("State ID is required");
    }

    // Get the state we're analyzing
    const { data: state, error: stateError } = await supabase
      .from("graph_states")
      .select("*")
      .eq("id", stateId)
      .single();

    if (stateError) {
      console.error("Error fetching state:", stateError);
      throw new Error("Failed to fetch state");
    }

    if (!state) {
      throw new ValidationError("State not found");
    }

    const openai = new OpenAI({ apiKey });

    // Analyze the conversation with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI that analyzes conversations and outputs a single number representing the negativity level of the last message. 
          Output only a number from 0-10, where 0 is completely positive/neutral and 10 is extremely negative.
          Consider factors like:
          - Hostile or aggressive language
          - Complaints or criticism
          - Negative emotions or mood
          - Sarcasm or passive-aggressiveness
          Only analyze the most recent message in the conversation.`,
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

    const negativityScore = parseFloat(content);
    if (isNaN(negativityScore)) {
      throw new Error(`Invalid score from OpenAI: ${content}`);
    }

    // Update the state value
    const { error: updateError } = await supabase
      .from("graph_states")
      .update({ starting_value: negativityScore.toString() })
      .eq("id", stateId);

    if (updateError) {
      console.error("Error updating state:", updateError);
      throw new Error("Failed to update state");
    }

    return NextResponse.json({ score: negativityScore });
  } catch (error) {
    console.error("Server error:", error);
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
}
