import { NextResponse } from "next/server";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

import { createClientFromJwt, getUser } from "@/lib/supabase/server/client";
import {
  AuthenticationError,
  ValidationError,
  handleApiError,
} from "@/lib/utils/errors";
import { decrypt } from "@/lib/utils/encryption";

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

    const {
      prompt,
      model = "gpt-3.5-turbo",
      temperature = 0.7,
    } = await request.json();

    if (!prompt) {
      throw new ValidationError("Prompt is required");
    }

    const chat = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: temperature,
    });

    console.log(apiKey);

    const messages = [new HumanMessage(prompt)];

    const response = await chat.invoke(messages);

    return NextResponse.json({
      response: response.content,
      model: model,
      temperature: temperature,
    });
  } catch (error) {
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
}
