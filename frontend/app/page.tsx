"use client";

import { useState, useEffect} from "react";
import ReactMarkdown from "react-markdown";
type TicketForm = {
  ticket_text: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  channel: "Web" | "Email" | "Chat" | "Phone";
  tier: "Premium" | "Standard" | "Basic";
  queue_load: number;
  agent_utilization: number;
};
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8001";
export default function Home() {
  const [form, setForm] = useState<TicketForm>({
    ticket_text: "",
    priority: "High",
    channel: "Web",
    tier: "Premium",
    queue_load: 72,
    agent_utilization: 0.84,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
  useState<AnalyzeTicketResponse | null>(null);
  const [apiStatus, setApiStatus] = useState<
  "checking" | "online" | "offline"
  >("checking");

  useEffect(() => {
  const checkApiHealth = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/health`
      );

      if (!response.ok) {
        throw new Error("Health check failed");
      }

      const data = await response.json();

      if (data.status === "healthy") {
        setApiStatus("online");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  };

  checkApiHealth();

  const interval = setInterval(
    checkApiHealth,
    30000
  );

  return () => clearInterval(interval);
}, []);


  const handleAnalyze = async () => {
  if (!form.ticket_text.trim()) {
    return;
  }

  if (apiStatus !== "online") {
  setError(
    "AI services are currently unavailable. Please wait for the service to come back online and try again."
  );
  return;
}

  const now = new Date();

  const payload = {
    ticket_text: form.ticket_text.trim(),

    ticket_priority: form.priority,
    ticket_channel: form.channel,
    customer_tier: form.tier,

    created_hour: now.getHours(),

    // JavaScript uses Sunday = 0.
    // Our ML model uses Monday = 0.
    created_day: (now.getDay() + 6) % 7,

    previous_contacts: 0,
    recent_tickets_30d: 1,

    sentiment_score: 0,

    queue_load: form.queue_load,
    agent_utilization: form.agent_utilization,

    account_age_days: 730,
  };

  console.log("SupportOps AI payload:", payload);

  try {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const response = await fetch(
      "/api/analyze-ticket",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `API request failed (${response.status}): ${errorBody}`
      );
    }

    const data: AnalyzeTicketResponse =
    await response.json();
    
    console.log("SupportOps AI response:", data);
    setResult(data);
  } catch (err) {
    console.error("SupportOps AI error:", err);

    setError(
      "We couldn't complete the ticket analysis. Please check that the AI services are online and try again."
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              SO
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                SupportOps AI
              </h1>
              <p className="text-xs text-slate-500">
                Intelligent Customer Support Operations
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
              apiStatus === "online"
                ? "border-emerald-200 bg-emerald-50"
                : apiStatus === "offline"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "online"
                  ? "bg-emerald-500"
                  : apiStatus === "offline"
                    ? "bg-red-500"
                    : "animate-pulse bg-amber-500"
              }`}
            />

            <span
              className={`text-xs font-medium ${
                apiStatus === "online"
                  ? "text-emerald-700"
                  : apiStatus === "offline"
                    ? "text-red-700"
                    : "text-amber-700"
              }`}
            >
              {apiStatus === "online"
                ? "AI Services Online"
                : apiStatus === "offline"
                  ? "AI Services Offline"
                  : "Checking AI Services..."}
            </span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-8">
        {/* Intro */}
        <div className="mb-7">
          <p className="mb-2 text-sm font-medium text-indigo-600">
            AI SUPPORT INTELLIGENCE
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Ticket Analysis Dashboard
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Analyze customer support requests using intent classification,
            SLA breach prediction, and retrieval-augmented AI recommendations.
          </p>
        </div>

        {/* Main Dashboard */}
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          {/* LEFT: Ticket Input */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Customer Ticket
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the ticket and operational context.
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  New Analysis
                </span>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {/* Ticket Message */}
              <div>
                <label
                  htmlFor="ticket"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Customer message
                </label>

                <textarea
                  id="ticket"
                  rows={6}
                  value={form.ticket_text}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ticket_text: e.target.value
                    })
                  }
                  placeholder="Example: My bank transfer has been pending for three business days..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Priority + Channel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as TicketForm["priority"]
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="channel"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Channel
                  </label>

                  <select
                    id="channel"
                    value={form.channel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        channel: e.target.value as TicketForm["channel"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  >
                    <option>Web</option>
                    <option>Email</option>
                    <option>Chat</option>
                    <option>Phone</option>
                  </select>
                </div>
              </div>

              {/* Customer Tier */}
              <div>
                <label
                  htmlFor="tier"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Customer tier
                </label>

                <select
                  id="tier"
                  value={form.tier}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tier: e.target.value as TicketForm["tier"]
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                >
                  <option>Premium</option>
                  <option>Standard</option>
                  <option>Basic</option>
                </select>
              </div>

              {/* Operational Signals */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Operational signals
                  </p>

                  <span className="text-xs text-slate-400">
                    Used by SLA model
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="queue"
                      className="mb-1.5 block text-xs text-slate-500"
                    >
                      Queue load (%)
                    </label>

                    <input
                      id="queue"
                      type="number"
                      value={form.queue_load}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          queue_load: Number(e.target.value),
                        })
                      }
                      min={0}
                      max={100}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="utilization"
                      className="mb-1.5 block text-xs text-slate-500"
                    >
                      Agent utilization
                    </label>

                    <input
                      id="utilization"
                      type="number"
                      value={form.agent_utilization}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          agent_utilization: Number(e.target.value),
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={
                  !form.ticket_text.trim() ||
                  isLoading ||
                  apiStatus !== "online"
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Analyzing Ticket...
                  </>
                ) : apiStatus === "checking" ? (
                  "Checking AI Services..."
                ) : apiStatus === "offline" ? (
                  "AI Services Offline"
                ) : (
                  "Analyze Ticket"
                )}
              </button>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm text-red-700">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Unable to analyze ticket
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-center text-xs leading-5 text-slate-400">
                DistilBERT + XGBoost + RAG intelligence pipeline
              </p>
            </div>
          </section>

          {/* RIGHT: AI Results */}
          <section className="space-y-6">
            {/* Top Result Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Intent */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Intent Classification
                    </p>

                    <h3 className="mt-2 text-lg font-semibold capitalize text-slate-900">
                      {isLoading
                      ? "Analyzing intent..."
                      : result
                      ? result.intent_analysis.intent.replaceAll("_", " ")
                      : "Awaiting analysis"}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                    NLP
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{
                    width: result
                    ? `${Math.min(
                      result.intent_analysis.confidence_percentage,
                      100
                    )}%`
                    : "0%",
                  }}
                  />
                  </div>

                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Confidence</span>
                  <span>
                    {result
                    ? `${result.intent_analysis.confidence_percentage.toFixed(2)}%`
                    : "—"}
                  </span>
                </div>
                {result && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">SLA Category</span>
                    
                    <span className="text-xs font-medium capitalize text-slate-600">
                      {result.intent_analysis.sla_category?.replaceAll("_", " ") ?? "—"}
                      </span>
                      </div>
                    )}
              </div>

              {/* SLA */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      SLA Breach Risk
                    </p>

                    <h3
                      className={`mt-2 text-lg font-semibold ${
                        !result
                          ? "text-slate-900"
                          : result.sla_analysis.breach_alert
                            ? "text-red-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {isLoading
                        ? "Calculating risk..."
                        : result
                          ? result.sla_analysis.breach_alert
                            ? "Breach Alert"
                            : "Within SLA"
                          : "Awaiting analysis"}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    ML
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result?.sla_analysis.breach_alert
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: result
                        ? `${Math.min(
                            result.sla_analysis.sla_breach_percentage,
                            100
                          )}%`
                        : "0%",
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Breach probability</span>
                  <span>{result ? `${result.sla_analysis.sla_breach_percentage.toFixed(2)}%` : "—"}</span>
                </div>
                {result && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">Alert threshold</span>

                    <span className="text-xs font-medium text-slate-600">
                      {(result.sla_analysis.decision_threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      AI Recommendation
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Support Resolution Guidance
                    </h3>
                  </div>

                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    RAG + Gemini
                  </span>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-8 text-center">
                    <div>
                      <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />

                      <p className="text-sm font-medium text-slate-600">
                        Generating grounded recommendation...
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Retrieving policy context and consulting Gemini.
                      </p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                        {result.support_recommendation.status.replaceAll("_", " ")}
                      </span>

                      <span className="text-xs text-slate-400">
                        Top retrieval similarity:{" "}
                        {(result.support_recommendation.top_similarity * 100).toFixed(2)}%
                      </span>
                    </div>

                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 text-sm leading-7 text-slate-700 last:mb-0">
                            {children}
                          </p>
                        ),

                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-900">
                            {children}
                          </strong>
                        ),

                        ol: ({ children }) => (
                          <ol className="ml-5 list-decimal space-y-2 text-sm text-slate-700">
                            {children}
                          </ol>
                        ),

                        ul: ({ children }) => (
                          <ul className="ml-5 list-disc space-y-2 text-sm text-slate-700">
                            {children}
                          </ul>
                        ),

                        li: ({ children }) => (
                          <li className="leading-7">
                            {children}
                          </li>
                        ),
                      }}
                    >
                      {result.support_recommendation.answer}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-8 text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className="text-lg">✦</span>
                      </div>

                      <p className="text-sm font-medium text-slate-600">
                        Recommendation will appear here
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Submit a customer ticket to retrieve relevant support
                        policies and generate grounded resolution guidance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sources */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Knowledge Base
                  </p>

                  <h3 className="mt-1 font-semibold text-slate-900">
                    Retrieved Sources
                  </h3>
                </div>

                <span className="text-xs text-slate-400">
                  ChromaDB vector search
                </span>
              </div>

              {result?.support_recommendation.sources?.length ? (
                <div className="space-y-3">
                  {result.support_recommendation.sources.map((source, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Source {index + 1}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {source.source ??
                              source.document ??
                              source.filename ??
                              "NovaBank policy"}
                          </p>
                        </div>

                        {typeof source.similarity === "number" && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            {(source.similarity * 100).toFixed(1)}% match
                          </span>
                        )}
                      </div>

                      {(source.content || source.text) && (
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                          {source.content ?? source.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">
                  Relevant NovaBank policy documents will appear here.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
          <span>SupportOps AI · ML & Generative AI Support Intelligence</span>

          <span>
            DistilBERT · XGBoost · ChromaDB · Gemini · FastAPI
          </span>
        </footer>
      </div>
    </main>
  );
}

type IntentPrediction = {
  intent: string;
  confidence: number;
  confidence_percentage: number;
};

type IntentAnalysis = {
  intent: string;
  confidence: number;
  confidence_percentage: number;
  top_predictions: IntentPrediction[];
  sla_category: string;
};

type SLAAnalysis = {
  sla_breach_probability: number;
  sla_breach_percentage: number;
  breach_alert: boolean;
  decision_threshold: number;
};

type RAGSource = {
  source?: string;
  document?: string;
  filename?: string;
  content?: string;
  text?: string;
  similarity?: number;
};

type SupportRecommendation = {
  status: string;
  answer: string;
  sources: RAGSource[];
  top_similarity: number;
};

type AnalyzeTicketResponse = {
  ticket_text: string;
  intent_analysis: IntentAnalysis;
  sla_analysis: SLAAnalysis;
  support_recommendation: SupportRecommendation;
};