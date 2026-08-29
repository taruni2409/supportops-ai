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

  const documents = await Promise.all(
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

  return documents;
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
    // STEP 1: Load NovaBank knowledge base
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // STEP 2: Gemini
    // ---------------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error:
            "GEMINI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const genAI =
      new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
      );

    const model =
      genAI.getGenerativeModel({
        model: "gemini-3.5-flash-lite",
      });

    // ---------------------------------------------------------
    // STEP 3: Analyze ticket
    // ---------------------------------------------------------

    const prompt = `
You are the SupportOps AI assistant for NovaBank.

Analyze the customer support ticket using ONLY
the NovaBank knowledge base provided below for
the support recommendation.

Do not invent company policies.

Customer Ticket:
${ticket_text.trim()}

Operational Context:
Priority: ${ticket_priority}
Channel: ${ticket_channel}
Customer Tier: ${customer_tier}
Queue Load: ${queue_load}%
Agent Utilization: ${agent_utilization}

NovaBank Knowledge Base:
${knowledgeContext}

Return ONLY valid JSON.

Use exactly this structure:

{
  "intent": "short intent name",
  "confidence_percentage": number,
  "sla_category": "short SLA category",
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
2. sla_category should describe the operational category.
3. Only use information supported by the knowledge base.
4. If the knowledge base does not contain enough information,
   say that further investigation is required.
5. Include only the most relevant knowledge-base sources.
6. Do not create fake source filenames.
`;

    let result;

    try {
      result =
        await model.generateContent(prompt);
    } catch (error: any) {
      console.error(
        "Gemini error:",
        error
      );

      if (error?.status === 429) {
        return Response.json(
          {
            error:
              "Gemini quota exceeded. Please try again later.",
          },
          {
            status: 429,
          }
        );
      }

      throw error;
    }

    const rawResponse =
      result.response.text();

    // ---------------------------------------------------------
    // STEP 4: Parse Gemini response
    // ---------------------------------------------------------

    let analysis;

    try {
      const cleanedResponse =
        rawResponse
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

      analysis =
        JSON.parse(cleanedResponse);

    } catch (error) {
      console.error(
        "Gemini returned invalid JSON:",
        rawResponse
      );

      return Response.json(
        {
          error:
            "AI returned an invalid response.",
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------------------
    // STEP 5: Calculate lightweight SLA risk
    //
    // This replaces the local XGBoost dependency for the
    // Vercel-only demo deployment.
    // ---------------------------------------------------------

    const priorityScore =
      ticket_priority === "Critical"
        ? 30
        : ticket_priority === "High"
          ? 20
          : ticket_priority === "Medium"
            ? 10
            : 0;

    const queueScore =
      Math.min(
        Number(queue_load) || 0,
        100
      ) * 0.25;

    const utilizationScore =
      Math.min(
        Number(agent_utilization) || 0,
        1
      ) * 25;

    const slaBreachPercentage =
      Math.min(
        95,
        Math.max(
          5,
          priorityScore +
            queueScore +
            utilizationScore
        )
      );

    const slaRisk =
      slaBreachPercentage >= 60
        ? "High"
        : slaBreachPercentage >= 30
          ? "Medium"
          : "Low";

    const decisionThreshold = 0.25;

    const breachAlert =
      slaBreachPercentage / 100 >=
      decisionThreshold;

    // ---------------------------------------------------------
    // STEP 6: Build response expected by the existing UI
    // ---------------------------------------------------------

    const sources = Array.isArray(
      analysis.sources
    )
      ? analysis.sources.map(
          (source: any, index: number) => ({
            rank: index + 1,
            source:
              source.source ||
              "Knowledge Base",
            chunk_id: String(index),
            text:
              source.text ||
              "",
            distance: null,
            similarity: null,
          })
        )
      : [];

    return Response.json({
      ticket_text,

      intent_analysis: {
        intent:
          analysis.intent ||
          "Unknown",

        confidence:
          Number(
            analysis.confidence_percentage
          ) / 100,

        confidence_percentage:
          Number(
            analysis.confidence_percentage
          ),

        sla_category:
          analysis.sla_category ||
          "General Support",
      },

      sla_analysis: {
        sla_breach_probability:
          Number(
            slaBreachPercentage
          ) / 100,

        sla_breach_percentage:
          Number(
            slaBreachPercentage.toFixed(2)
          ),

        breach_alert:
          breachAlert,

        risk:
          slaRisk,

        decision_threshold:
          decisionThreshold,
      },

      support_recommendation: {
        status:
          analysis.recommended_resolution
            ? "answered"
            : "insufficient_context",

        priority:
          ticket_priority ||
          "Unknown",

        resolution:
          analysis.recommended_resolution ||
          "Further investigation is required.",

        sources,

        top_similarity:
          null,
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
          "AI processing failed.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}