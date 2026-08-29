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
        { error: "Ticket text is required" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Send the ticket to the Python backend.
    //
    // The FastAPI /analyze-ticket endpoint performs:
    // 1. Intent classification
    // 2. SLA risk prediction
    // 3. RAG retrieval
    // 4. Grounded support recommendation
    // ---------------------------------------------------------

    const apiUrl =
      process.env.RAG_API_URL ||
      "http://localhost:8000/analyze-ticket";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticket_text: ticket_text.trim(),

        ticket_priority: ticket_priority,
        ticket_channel: ticket_channel,
        customer_tier: customer_tier,

        queue_load:
          typeof queue_load === "number"
            ? queue_load
            : 0,

        agent_utilization:
          typeof agent_utilization === "number"
            ? agent_utilization
            : 0,

        // These are required by the current
        // FastAPI AnalyzeTicketRequest schema.
        //
        // The frontend currently does not collect
        // these separately, so use safe defaults.
        created_hour: new Date().getHours(),
        created_day: new Date().getDay(),
        previous_contacts: 0,
        recent_tickets_30d: 0,
        sentiment_score: 0,
        account_age_days: 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "FastAPI analyze-ticket error:",
        data
      );

      return Response.json(
        {
          error:
            data?.detail ||
            "AI analysis failed",
        },
        {
          status: response.status,
        }
      );
    }

    // Return the Python backend response unchanged.
    //
    // This preserves:
    // - intent_analysis.sla_category
    // - sla_analysis.decision_threshold
    // - RAG sources
    // - similarity scores
    // - grounded recommendation
    return Response.json(data);

  } catch (error) {
    console.error(
      "SupportOps AI proxy error:",
      error
    );

    return Response.json(
      {
        error: "Unable to connect to SupportOps AI backend",
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