import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {

    try {

        const body = await req.json();

        const {
            ticket_text,
            priority,
            channel,
            tier,
            queue_load,
            agent_utilization
        } = body;


        const genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY!
        );


        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });


        const prompt = `
You are an AI Support Operations Assistant.

Analyze this customer support ticket.

Customer Ticket:
${ticket_text}

Operational Context:
Priority: ${priority}
Channel: ${channel}
Customer Tier: ${tier}
Queue Load: ${queue_load}%
Agent Utilization: ${agent_utilization}


Return ONLY this format:

Intent:
Confidence:
SLA Risk:
Recommended Resolution:

Provide enterprise-level support guidance.
`;


        const result = await model.generateContent(prompt);


        return Response.json({
            answer: result.response.text(),

            // keep UI compatibility
            intent: "AI Generated",
            confidence: 0.95,
            sla_risk: "Predicted by Gemini"
        });


    } catch(error) {

        console.error(error);

        return Response.json(
            {
                error:"AI processing failed"
            },
            {
                status:500
            }
        );
    }
}