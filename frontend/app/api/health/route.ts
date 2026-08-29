export async function GET() {
  try {
    const apiUrl =
      process.env.SUPPORTOPS_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${apiUrl}/health`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { status: "offline" },
        { status: 503 }
      );
    }

    const data = await response.json();

    return Response.json(data);

  } catch (error) {
    console.error(
      "SupportOps health check failed:",
      error
    );

    return Response.json(
      { status: "offline" },
      { status: 503 }
    );
  }
}