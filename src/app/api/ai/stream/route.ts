import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
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
      messages = [],
      model = "gpt-4o",
      temperature = 0.7,
    } = await request.json();

    if (!prompt) {
      throw new ValidationError("Prompt is required");
    }

    const chat = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: temperature,
      streaming: true,
    });

    // Convert messages to LangChain format
    const langChainMessages = messages.map((msg: any) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "user":
          return new HumanMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
    // Add the new prompt
    langChainMessages.push(new SystemMessage(prompt));

    console.log("LangChain Messages: ", langChainMessages);

    const chatStream = await chat.stream(langChainMessages);
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream) {
            const text = typeof chunk.content === 'string' 
              ? chunk.content 
              : JSON.stringify(chunk.content);
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const { error: errorMessage, status, code } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, code }, { status });
  }
} 