import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";

async function loadKnowledgeBase() {
  const knowledgeBasePath = path.join(
    process.cwd(),
    "data",
    "knowledge_base"
  );

  const files = await fs.readdir(knowledgeBasePath);

  const markdownFiles = files.filter((file) =>
    file.endsWith(".md")
  );

  return Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(
        knowledgeBasePath,
        file
      );

      const text = await fs.readFile(
        filePath,
        "utf-8"
      );

      return {
        source: file,
        text,
      };
    })
  );
}

async function analyzeWithVercelFallback(body: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const knowledgeBase =
    await loadKnowledgeBase();

  const knowledgeContext =
    knowledgeBase
      .map(
        (document) => `
SOURCE: ${document.source}

${document.text}
`
      )
      .join("\n\n");

  const genAI =
    new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

  const model =
    genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
    });

  const prompt = `
You are the SupportOps AI assistant for NovaBank.

Analyze the customer support ticket using ONLY
the NovaBank knowledge base provided below for
the support recommendation.

Do not invent company policies.

Customer Ticket:
${body.ticket_text.trim()}

Operational Context:
Priority: ${body.ticket_priority}
Channel: ${body.ticket_channel}
Customer Tier: ${body.customer_tier}
Queue Load: ${body.queue_load}%
Agent Utilization: ${body.agent_utilization}

NovaBank Knowledge Base:
${knowledgeContext}

Return ONLY valid JSON.

Use exactly this structure:

{
  "intent": "short intent name",
  "confidence_percentage": number,
  "sla_category": "short SLA category",
  "sla_breach_percentage": number,
  "sla_risk": "Low | Medium | High",
  "recommended_resolution": "support recommendation based on the knowledge base",
  "sources": [
    {
      "source": "filename",
      "text": "relevant excerpt from the knowledge base"
    }
  ]
}

Rules:

1. confidence_percentage must be between 0 and 100.
2. sla_breach_percentage must be between 0 and 100.
3. Only use information supported by the knowledge base.
4. If the knowledge base does not contain enough information,
   say that further investigation is required.
5. Include only the most relevant knowledge-base sources.
6. Do not create fake source filenames.
`;

  const result =
    await model.generateContent(prompt);

  const rawResponse =
    result.response.text();

  const cleanedResponse =
    rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  return JSON.parse(cleanedResponse);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      ticket_text,
      ticket_priority,
      ticket_channel,
      customer_tier,
      queue_load,
      agent_utilization,
    } = body;

    if (!ticket_text?.trim()) {
      return Response.json(
        {
          error: "Ticket text is required",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // MODE 1: Full local Docker deployment
    //
    // If RAG_API_URL exists, use the FastAPI backend.
    // FastAPI performs:
    // - Intent classification
    // - SLA prediction
    // - RAG retrieval
    // - Gemini recommendation
    // ---------------------------------------------------------

    if (process.env.RAG_API_URL) {
      const response = await fetch(
        process.env.RAG_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_text: ticket_text.trim(),

            ticket_priority,
            ticket_channel,
            customer_tier,

            queue_load:
              typeof queue_load === "number"
                ? queue_load
                : 0,

            agent_utilization:
              typeof agent_utilization === "number"
                ? agent_utilization
                : 0,

            created_hour:
              new Date().getHours(),

            created_day:
              (new Date().getDay() + 6) % 7,

            previous_contacts: 0,
            recent_tickets_30d: 0,
            sentiment_score: 0,
            account_age_days: 730,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "FastAPI analyze-ticket error:",
          data
        );

        return Response.json(
          {
            error:
              data?.detail ||
              data?.error ||
              "AI analysis failed",
          },
          {
            status: response.status,
          }
        );
      }

      return Response.json(data);
    }

    // ---------------------------------------------------------
    // MODE 2: Free Vercel deployment
    //
    // No backend is required.
    // Gemini + bundled knowledge base are used.
    // ---------------------------------------------------------

    const analysis =
      await analyzeWithVercelFallback(body);

    return Response.json({
      ticket_text,

      answer:
        analysis.recommended_resolution ||
        "Further investigation is required.",

      intent_analysis: {
        intent:
          analysis.intent ||
          "Unknown",

        confidence_percentage:
          typeof analysis.confidence_percentage ===
          "number"
            ? analysis.confidence_percentage
            : 0,

        sla_category:
          analysis.sla_category ||
          "Unknown",
      },

      sla_analysis: {
        sla_breach_percentage:
          typeof analysis.sla_breach_percentage ===
          "number"
            ? analysis.sla_breach_percentage
            : 0,

        risk:
          analysis.sla_risk ||
          "Unknown",

        decision_threshold: 0.25,
      },

      support_recommendation: {
        status:
          analysis.recommended_resolution
            ? "answered"
            : "insufficient_context",

        priority:
          ticket_priority ||
          "Unknown",

        answer:
          analysis.recommended_resolution ||
          "Further investigation is required.",

        sources:
          Array.isArray(analysis.sources)
            ? analysis.sources.map(
                (
                  source: any,
                  index: number
                ) => ({
                  rank: index + 1,
                  source:
                    source.source ||
                    "Unknown",
                  chunk_id:
                    String(index),
                  text:
                    source.text || "",
                  distance: null,
                  similarity: null,
                })
              )
            : [],

        top_similarity: null,
      },
    });

  } catch (error) {
    console.error(
      "SupportOps AI error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI processing failed",
      },
      {
        status: 500,
      }
    );
  }
}