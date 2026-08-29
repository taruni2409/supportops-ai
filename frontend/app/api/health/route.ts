export async function GET() {
  return Response.json({
    status: "healthy",
    service: "SupportOps AI",
    components: {
      frontend: "ready",
      gemini: "ready",
      knowledge_base: "ready",
    },
  });
}