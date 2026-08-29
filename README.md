SupportOps AI

AI-Powered Customer Support Intelligence & Resolution Platform.

SupportOps AI is an end-to-end Machine Learning and Generative AI
project designed to automate customer support ticket analysis, predict
operational risks, retrieve relevant knowledge, and generate grounded
resolution recommendations.

The project is intentionally available in two modes:

Free hosted Vercel demo --- a lightweight deployment that uses
the Next.js application, Gemini, and the bundled synthetic NovaBank
knowledge base without requiring a separately hosted backend.

Full local deployment --- the complete Dockerized system with
Next.js, FastAPI, DistilBERT, XGBoost, ChromaDB/RAG, and Gemini.

Important: The NovaBank policies and operational data are
synthetic and were created for this portfolio project. They are not
real bank policies or production customer data.

Capabilities

Customer support ticket classification

77-class support intent classification

Sentiment analysis

Ticket priority and operational-context handling

SLA breach prediction

Explainable AI with SHAP

Retrieval-Augmented Generation (RAG)

Semantic document retrieval with ChromaDB

Gemini-powered grounded resolution recommendations

Retrieval-confidence and out-of-domain guardrails

Interactive analytics dashboard

REST API

FastAPI backend

Docker and Docker Compose deployment

Health monitoring

Automated API tests

MLOps and CI/CD-ready architecture

Table of Contents

Project Architecture

Technology Stack

Data Strategy

Phase 1 --- Initial Dataset Exploration & Baseline NLP
Classification

BANKING77 Intent Classification

Retrieval-Augmented Generation
(RAG)

SLA Breach Risk Prediction

FastAPI Backend

Full-Stack Application

Deployment Modes

Running the Full System Locally

Using the FastAPI Backend

Environment Variables and API
Keys

Free Vercel Deployment

Docker Architecture

Knowledge Base and RAG
Ingestion

Evaluation Summary

Application Screenshots

Troubleshooting

Repository Structure

Future Improvements

Project Architecture

Complete Local Architecture

The full local version runs the frontend and AI backend as separate
services.

                    Customer Support Agent
                              |
                              v
                       Next.js Dashboard
                    React + TypeScript
                              |
                              v
                 /api/analyze-ticket
                              |
                              v
                    FastAPI Backend
                         :8000
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
        DistilBERT         XGBoost       RAG Pipeline
       Intent Model       SLA Risk       ChromaDB
                                             |
                                             v
                                      NovaBank Policies
                                             |
                                             v
                                         Gemini
                                             |
                                             v
                                  Grounded Recommendation

The browser-facing services are:

Frontend: http://localhost:3000
Backend:  http://localhost:8001
Swagger:  http://localhost:8001/docs

Inside Docker Compose, the frontend communicates with the backend using:

http://backend:8000

The host port 8001 maps to the backend container's port 8000.

Technology Stack

Python

Scikit-learn

PyTorch

Hugging Face Transformers

Sentence Transformers

ChromaDB

XGBoost

SHAP

FastAPI

Uvicorn

Google Gemini

Next.js

React

TypeScript

Tailwind CSS

Docker

Docker Compose

Git / GitHub

MLflow-ready model workflow

PostgreSQL / pgvector as a potential production extension

Azure as a potential production deployment target

Data Strategy

SupportOps AI uses different datasets for different modelling problems
rather than forcing one dataset to solve every task.

This was an important design decision during development.

Dataset 1 --- Initial Customer-Support Dataset

An initial customer-support dataset containing 8,469 tickets was
evaluated for automated ticket-type classification.

Data-quality analysis identified:

85 unique ticket texts associated with multiple target labels

205 rows affected by conflicting labels

Exact duplicate ticket descriptions

29 exact ticket texts initially appearing across both training and
test sets

Highly templated ticket descriptions with weak alignment between
text and target labels

After removing conflicting records and exact duplicates, the final
modelling dataset contained 8,240 unique ticket texts with zero
exact train/test overlap.

The dataset was therefore retained for operational analytics and
dashboard exploration rather than used as the primary
intent-classification dataset.

Dataset 2 --- BANKING77

BANKING77 was selected as the primary intent-classification dataset
because it provides a consistent set of 77 customer-support intents
and is much better suited to fine-grained NLP intent classification.

Dataset 3 --- Synthetic NovaBank SLA Dataset

The original customer-support dataset was also evaluated for SLA
modelling. However, 49.30% of resolved tickets produced impossible
negative response-to-resolution durations.

Instead of constructing an SLA target from unreliable timestamps, a
controlled synthetic NovaBank operational dataset was used with explicit
SLA rules and documented risk-generation assumptions.

This separation gives the project a clearer modelling design:

BANKING77
    |
    +--> Intent Classification
          |
          v
      DistilBERT

Synthetic NovaBank Operational Data
    |
    +--> SLA Risk Prediction
          |
          v
       XGBoost

Synthetic NovaBank Policies
    |
    +--> Knowledge Retrieval
          |
          v
       ChromaDB
          |
          v
       Gemini RAG

Phase 1 --- Initial Dataset Exploration & Baseline NLP Classification

An initial customer-support dataset containing 8,469 tickets was
evaluated for automated ticket-type classification.

Baseline Model

A baseline NLP classifier was developed using:

TF-IDF text vectorization

Unigrams and bigrams

Logistic Regression

Stratified 80/20 train-test split

Results after data-quality corrections:

Metric               Score

Accuracy            19.54%
Macro Precision     19.63%
Macro Recall        19.54%
Macro F1            19.53%

With five approximately balanced target classes, random-chance accuracy
is approximately 20%.

Error analysis showed that ticket subjects and descriptions were weakly
associated with the provided ticket-type labels.

For example, tickets with the subject "Refund request" were
distributed across all five target classes rather than predominantly
belonging to the "Refund request" class.

Decision

The dataset was therefore not used as the primary training source for
the SupportOps AI ticket-intent classifier.

It was retained for operational analytics and dashboard development,
while BANKING77 was selected for the NLP modelling component.

BANKING77 Intent Classification

After identifying label-quality issues in the initial customer-support
dataset, BANKING77 was selected as the primary dataset for SupportOps AI
intent classification.

Dataset

10,003 official training examples

3,080 official test examples

77 customer-support intents

7 normalized queries overlapped between the official training and
test sets

A strict evaluation set was created with zero normalized train/test
overlap

TF-IDF + Logistic Regression Baseline

The first BANKING77 baseline used:

TF-IDF text vectorization

Unigrams and bigrams

Logistic Regression

77-class intent classification

Evaluation                   Accuracy   Macro F1

Official Test                  85.88%     85.81%
Strict Zero-Overlap Test       85.84%     85.76%

The small difference between official and strict evaluations indicates
that the overlapping examples did not materially inflate performance.

Hyperparameter Tuning

The classical model was optimized using:

Stratified train/validation splitting

3-fold Stratified Cross-Validation

GridSearchCV

Macro F1 as the model-selection metric

TF-IDF n-gram tuning

Minimum document-frequency tuning

Sublinear term-frequency tuning

Logistic Regression regularization tuning

Best configuration:

ngram_range = (1, 1)

min_df = 1

sublinear_tf = True

C = 4.0

Best cross-validation Macro F1: approximately 86.67%.

Transformer Model --- DistilBERT

A pretrained distilbert-base-uncased model was fine-tuned for the same
77-class BANKING77 task.

Token-length analysis showed:

Mean sequence length: ~16 tokens

95% of queries: ≤ 37 tokens

99% of queries: ≤ 53 tokens

Maximum sequence length: 98 tokens

Based on this distribution, max_length = 64 was selected to reduce
unnecessary padding while retaining virtually all query information.

DistilBERT Experiment 1 --- 3 Epochs

Evaluation                   Accuracy   Macro F1

Official Test                  81.59%     79.75%
Strict Zero-Overlap Test       81.61%     79.75%

Learning-curve analysis showed that validation performance was still
improving after epoch 3, indicating that the model was undertrained.

DistilBERT Experiment 2 --- 5 Epochs

Training was increased from 3 to 5 epochs.

Best validation Macro F1: 90.00%

Evaluation                     Accuracy     Macro F1

Official Test                90.62%   90.59%
Strict Zero-Overlap Test     90.60%   90.57%

Model Comparison

Model                Official Official Macro         Strict   Strict Macro
Accuracy             F1       Accuracy             F1

TF-IDF +               85.88%         85.81%         85.84%         85.76%
Logistic
Regression

DistilBERT - 3         81.59%         79.75%         81.61%         79.75%
Epochs

The final 5-epoch DistilBERT model improved official Macro F1 by
approximately 4.78 percentage points over the classical TF-IDF +
Logistic Regression baseline.

Retrieval-Augmented Generation (RAG)

SupportOps AI includes a grounded knowledge assistant for generating
policy-based customer-support recommendations.

The RAG pipeline uses:

Sentence Transformers (all-MiniLM-L6-v2) for semantic embeddings

384-dimensional normalized text embeddings

ChromaDB for persistent vector storage

Cosine-similarity retrieval

Top-K semantic retrieval over synthetic NovaBank support policies

Gemini Flash-Lite for grounded response generation

Explicit source citations for generated recommendations

Retrieval-confidence guardrails

Safe fallback behavior when retrieved policies do not support an
answer

Knowledge Base

The demonstration knowledge base contains eight synthetic NovaBank
policy documents covering:

Card payments

Refunds

Bank transfers

Cash withdrawals

Cards and PIN

Account security

Identity verification

Support escalation

All policies are synthetic and were created solely for this portfolio
project.

RAG Evaluation

Retrieval was evaluated separately from generation to distinguish
retrieval failures from LLM-generation failures.

On the controlled synthetic evaluation set:

Metric                           Result

Retrieval Hit@1                    100%
Retrieval Hit@3                    100%
Supported-query pass rate          100%
Out-of-domain rejection rate       100%
Citation compliance                100%
Citation/refusal behavior          100%

These results reflect a controlled synthetic evaluation and should not
be interpreted as production-level performance.

RAG Guardrails

SupportOps AI uses two levels of protection against unsupported
responses:

A retrieval-confidence threshold prevents clearly unrelated
questions from reaching the LLM.

Grounding instructions require the LLM to use only retrieved policy
evidence and return an insufficient-context response when the
available policies do not support an answer.

SLA Breach Risk Prediction

SupportOps AI includes an explainable SLA-risk model designed to
identify support tickets that may require proactive intervention.

Data Quality Decision

The original customer-support dataset was evaluated for SLA modelling,
but 49.30% of resolved tickets produced impossible negative
response-to-resolution durations.

Rather than constructing a misleading SLA target from unreliable
timestamps, the project uses a controlled synthetic NovaBank operational
dataset with explicit SLA rules and documented risk-generation
assumptions.

SLA Rules

Priority     Resolution SLA

Critical            4 hours
High                8 hours
Medium             24 hours
Low                48 hours

Models Evaluated

Two models were evaluated:

Logistic Regression baseline

XGBoost classifier

Model selection used the validation set with an operational requirement
of at least 70% recall for SLA breaches.

XGBoost was selected at a decision threshold of 0.25, providing a
better precision/F1 trade-off while satisfying the recall requirement.

Final Test Performance

Metric            Result

Precision         40.23%
Recall        77.98%
F1                53.07%
ROC-AUC           66.54%
PR-AUC            49.65%

The lower operational threshold intentionally prioritizes breach
detection over raw accuracy because missed SLA breaches are considered
more costly than additional review alerts.

Explainability

SHAP was used to explain both global model behaviour and individual
ticket predictions.

The strongest global risk drivers included:

Queue load

Agent utilization

Ticket creation timing

Critical ticket priority

Customer sentiment

Previous customer contacts

Outside-business-hours submission

The evaluation results reflect a controlled synthetic SLA-risk dataset
and should not be interpreted as production performance.

FastAPI Backend

SupportOps AI exposes its ML and GenAI capabilities through a unified
FastAPI backend.

API Endpoints

Endpoint                            Purpose

GET /health                       Check API and component readiness

POST /predict-intent              Predict one of 77 BANKING77 support
intents using DistilBERT

POST /predict-sla-risk            Estimate SLA-breach probability
using XGBoost

POST /rag                         Generate grounded support
recommendations using ChromaDB
retrieval and Gemini

Unified Ticket Analysis

The /analyze-ticket endpoint combines the three AI components:

DistilBERT predicts the fine-grained support intent.

The intent is mapped into the broader operational category used by
the SLA model.

XGBoost estimates SLA-breach risk using ticket and workload
features.

The RAG pipeline retrieves relevant NovaBank policies.

Gemini generates a grounded recommendation with source information.

Example Request

curl -s -X POST http://localhost:8001/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_text": "I do not recognize this card transaction and think it may be fraudulent.",
    "ticket_priority": "High",
    "ticket_channel": "Web",
    "customer_tier": "Premium",
    "queue_load": 70,
    "agent_utilization": 0.84,
    "created_hour": 10,
    "created_day": 2,
    "previous_contacts": 0,
    "recent_tickets_30d": 1,
    "sentiment_score": 0,
    "account_age_days": 730
  }'

API Reliability

The backend includes:

Pydantic request validation

Explicit response structures

CORS configuration for frontend integration

Gemini error handling

Retrieval-confidence guardrails

Health checks

Automated FastAPI tests

On CPU-only systems, API serving uses OMP_NUM_THREADS=1 for stable
interoperability between PyTorch and XGBoost.

Full-Stack Application

SupportOps AI was extended into a complete full-stack AI application by
integrating a Next.js frontend dashboard with the FastAPI AI backend.

The application provides an interactive interface for customer support
analysts to:

Submit customer tickets

View intent predictions

View confidence scores

Visualize SLA breach probability

View SLA risk and alert threshold

Receive AI-generated support recommendations

Inspect retrieved knowledge sources

Understand the retrieval component behind recommendations

Frontend Technology

Next.js

React

TypeScript

Tailwind CSS

REST API integration

Docker containerized deployment

User Workflow

User submits a support ticket.

Next.js sends the request to /api/analyze-ticket.

In full local mode, the Next.js route proxies the request to
FastAPI.

FastAPI orchestrates the AI components.

DistilBERT predicts ticket intent.

XGBoost estimates SLA breach probability.

ChromaDB retrieves relevant policy context.

Gemini generates grounded resolution guidance.

The frontend displays the results and sources.

Deployment Modes

Mode 1 --- Free Vercel Demo

The hosted deployment is intentionally lightweight so that the project
can be demonstrated without paying for a separately hosted Python
backend.

Browser
   |
   v
Vercel / Next.js
   |
   +--> Gemini
   |
   +--> Bundled NovaBank Knowledge Base

The free hosted mode provides:

Interactive dashboard

Ticket analysis

Gemini recommendation generation

Synthetic policy grounding

Retrieved-source display

It does not require the Dockerized FastAPI ML backend to be
continuously hosted.

Mode 2 --- Full Local System

The full version runs locally using Docker Compose:

Browser
   |
   v
Next.js :3000
   |
   v
FastAPI :8000
   |
   +--> DistilBERT
   +--> XGBoost
   +--> ChromaDB/RAG
   +--> Gemini

This mode exposes the complete ML/RAG architecture and the FastAPI API.

Running the Full System Locally

Prerequisites

Install:

Git

Docker Desktop

Docker Compose

A Google Gemini API key is required for Gemini-powered recommendations.

Clone the Repository

git clone https://github.com/taruni2409/supportops-ai.git
cd supportops-ai

Configure the Gemini API Key

Create a .env file in the repository root:

GEMINI_API_KEY=your_gemini_api_key

Do not commit .env.

The repository .gitignore already excludes environment files.

Build and Start

docker compose up --build

The first build may take time because the backend installs PyTorch,
Transformers, Sentence Transformers, ChromaDB, XGBoost, and other
dependencies.

Service URLs

After the containers start:

Frontend Dashboard

http://localhost:3000

Backend API

http://localhost:8001

Swagger Documentation

http://localhost:8001/docs

Backend Health

curl http://localhost:8001/health

Expected response contains:

{
  "status": "healthy"
}

Check Container Status

docker compose ps

The backend should eventually show:

Up (healthy)

Stop the Application

docker compose down

Rebuild After Code Changes

docker compose up --build

To rebuild only the frontend:

docker compose up --build -d frontend

Using the FastAPI Backend

The FastAPI backend is available for users who want the complete API
locally rather than only using the hosted dashboard.

Swagger

Open:

http://localhost:8001/docs

Swagger provides interactive documentation and allows API requests to be
tested directly from the browser.

Health Check

curl http://localhost:8001/health

Complete Ticket Analysis

curl -s -X POST http://localhost:8001/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_text": "I do not recognize this card transaction and think it may be fraudulent.",
    "ticket_priority": "High",
    "ticket_channel": "Web",
    "customer_tier": "Premium",
    "queue_load": 70,
    "agent_utilization": 0.84,
    "created_hour": 10,
    "created_day": 2,
    "previous_contacts": 0,
    "recent_tickets_30d": 1,
    "sentiment_score": 0,
    "account_age_days": 730
  }'

The response contains:

Intent prediction

Intent confidence

SLA breach probability

SLA risk

Decision threshold

Grounded recommendation

Retrieved knowledge sources

Environment Variables and API Keys

Root .env

The full Docker backend reads environment variables from the root .env
file.

Minimum configuration:

GEMINI_API_KEY=your_gemini_api_key

Additional environment variables can be added as the project evolves.

Frontend Local Development

If running Next.js outside Docker, frontend environment variables can be
configured in:

frontend/.env.local

Do not commit this file.

Docker Backend URL

Inside Docker Compose, the frontend communicates with FastAPI using the
service name:

RAG_API_URL=http://backend:8000/analyze-ticket

Do not use localhost:8001 from inside the frontend container. In
Docker, localhost refers to the current container.

Free Vercel Deployment

The repository can also be connected to Vercel for a free hosted
demonstration.

Existing Vercel Project

If the GitHub repository is already connected to Vercel, it can remain
connected. New commits to the configured branch can trigger a
redeployment.

Recommended Vercel Configuration

For the Next.js frontend:

Framework: Next.js

Root directory: frontend

Build command: npm run build

Start command: managed by Vercel

Node.js version: use a currently supported Vercel Node.js version

Vercel Environment Variable

Add:

GEMINI_API_KEY

with the Gemini API key as the value.

For the lightweight hosted mode, do not configure RAG_API_URL to a
nonexistent local Docker address.

The application route supports two modes:

RAG_API_URL exists
        |
        v
Full FastAPI backend mode

RAG_API_URL absent
        |
        v
Free Vercel Gemini + bundled knowledge-base mode

Important Limitation

Vercel is used here as the free hosted demonstration layer. The full
DistilBERT/XGBoost/ChromaDB FastAPI stack is intended to be run locally
unless a separate backend hosting solution is later introduced.

This avoids requiring users to pay for backend infrastructure while
still keeping the complete backend/API implementation available in the
repository.

Docker Architecture

SupportOps AI uses Docker Compose with two services.

Backend Container

The backend container runs:

FastAPI

DistilBERT inference

XGBoost inference

RAG pipeline

ChromaDB

Sentence Transformer embeddings

Gemini integration

The backend listens internally on:

8000

and is exposed to the host as:

8001

Frontend Container

The frontend container runs:

Next.js

React

TypeScript

Tailwind CSS

It listens on:

3000

Service Communication

Host
 |
 +--> localhost:3000 --> frontend container
 |
 +--> localhost:8001 --> backend container :8000

frontend container
 |
 +--> backend:8000 --> backend container

The Docker health check waits for:

GET /health

to return successfully before allowing the frontend dependency to start.

Knowledge Base and RAG Ingestion

The project contains synthetic NovaBank Markdown policy documents.

The backend knowledge base covers:

01_card_payments.md
02_refunds.md
03_bank_transfers.md
04_cash_withdrawals.md
05_cards_and_pin.md
06_account_security.md
07_identity_verification.md
08_support_escalation.md

RAG Ingestion

The repository contains ingestion utilities under:

rag/ingestion/

The ingestion process:

Reads Markdown policy documents.

Splits documents into retrievable chunks.

Generates 384-dimensional embeddings using Sentence Transformers.

Stores vectors in ChromaDB.

Makes the collection available to the RAG pipeline.

The local ChromaDB directory is ignored by Git because it is a generated
artifact.

If the vector database needs to be regenerated, use the project's
ingestion script from the repository environment and verify the current
script options before running it.

Evaluation Summary

Intent Classification

Model                              Accuracy     Macro F1

TF-IDF + Logistic Regression         85.88%       85.81%
DistilBERT - 3 Epochs                81.59%       79.75%
DistilBERT - 5 Epochs            90.62%   90.59%

Strict Zero-Overlap Intent Evaluation

Model                              Accuracy     Macro F1

TF-IDF + Logistic Regression         85.84%       85.76%
DistilBERT - 3 Epochs                81.61%       79.75%
DistilBERT - 5 Epochs            90.60%   90.57%

RAG

Metric                        Result

Hit@1                           100%
Hit@3                           100%
Supported-query pass rate       100%
OOD rejection rate              100%
Citation compliance             100%

SLA Risk

Metric                     Result

Precision                  40.23%
Recall                 77.98%
F1                         53.07%
ROC-AUC                    66.54%
PR-AUC                     49.65%
Decision threshold           0.25

The evaluation numbers for RAG and SLA modelling are based on
controlled/synthetic data and should not be interpreted as
production-level performance.

Application Screenshots

Ticket Analysis Dashboard

The dashboard allows users to submit customer tickets and view:

Intent classification

Confidence

SLA breach probability

SLA risk

Alert threshold

AI-generated support recommendations

Retrieved knowledge sources



AI Recommendation and RAG Retrieval

The system retrieves relevant support documents from ChromaDB and
generates grounded recommendations using Gemini.



Backend API Documentation

FastAPI provides interactive Swagger documentation for testing
endpoints.



Health Monitoring

The backend exposes health checks for service readiness.



FastAPI Root / Health-Ready API



Troubleshooting

Frontend Shows "AI Services Offline"

Check the frontend health endpoint:

curl http://localhost:3000/api/health

Then check the backend:

curl http://localhost:8001/health

Check Docker status:

docker compose ps

Check backend logs:

docker compose logs backend --tail=50

Check frontend logs:

docker compose logs frontend --tail=50

Port 3000 Already in Use

Check:

lsof -i :3000

Stop the process using port 3000, or stop the existing local Next.js
development server before starting Docker.

Port 8001 Already in Use

Check:

lsof -i :8001

Stop the process using the port before starting Docker.

Frontend Cannot Reach FastAPI

Inside Docker, the frontend must use:

http://backend:8000

not:

http://localhost:8001

Verify:

grep -n -A3 -B2 "RAG_API_URL" docker-compose.yml

Expected:

environment:
  RAG_API_URL: "http://backend:8000/analyze-ticket"

Knowledge Base ENOENT Error

If you see an error similar to:

ENOENT: no such file or directory, scandir '/app/data/knowledge_base'

the frontend is attempting to load the knowledge base directly.

In full Docker mode, the knowledge base belongs to the backend. The
Next.js API route should proxy to FastAPI when RAG_API_URL is
configured.

Gemini API Errors

Verify that:

GEMINI_API_KEY

is configured in the environment used by the service.

Do not commit the API key to GitHub.

Repository Structure

supportops-ai/
│
├── api/
│   └── main.py
│
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-ticket/
│   │   │   └── health/
│   │   └── page.tsx
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── knowledge_base/
│   ├── 01_card_payments.md
│   ├── 02_refunds.md
│   ├── 03_bank_transfers.md
│   ├── 04_cash_withdrawals.md
│   ├── 05_cards_and_pin.md
│   ├── 06_account_security.md
│   ├── 07_identity_verification.md
│   └── 08_support_escalation.md
│
├── ml/
│   ├── inference/
│   └── training/
│
├── rag/
│   ├── ingestion/
│   └── pipeline.py
│
├── data/
│   ├── raw/
│   └── processed/
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .gitignore
└── README.md

Generated artifacts such as:

.env
frontend/.env.local
frontend/.next/
node_modules/
rag/chroma_db/
ml/artifacts/
data/raw/
data/processed/

are intentionally excluded from Git where appropriate.

Git Workflow

After making changes:

git status

Review the files:

git diff

Stage the intended changes:

git add README.md Dockerfile docker-compose.yml frontend/

Commit:

git commit -m "Finalize SupportOps AI deployment documentation"

Push:

git push origin main

If the repository is connected to Vercel, the push can trigger a new
Vercel deployment according to the project's configured deployment
settings.

Future Improvements

Potential improvements include:

Deploying the full backend to Azure Kubernetes Service (AKS)

Adding authentication and role-based access control

Implementing real-time ticket streaming

Adding production model monitoring with MLflow

Integrating enterprise ticketing systems

Expanding multilingual support

Adding richer ticket-history features

Adding automated feedback loops from support agents

Adding stronger retrieval evaluation with a larger human-labelled
dataset

Replacing synthetic operational data with validated real-world data
where legally and ethically appropriate

Adding observability with metrics, logging, and distributed tracing

Introducing CI/CD pipelines for automated testing and deployment

Project Status

The current project demonstrates a complete AI support-operations
workflow:

Data Quality Analysis
        |
        v
Intent Classification
        |
        v
SLA Risk Prediction
        |
        v
Semantic Retrieval
        |
        v
Grounded Generative AI
        |
        v
FastAPI
        |
        v
Next.js Dashboard
        |
        +--------------------+
        |                    |
        v                    v
Free Vercel Demo       Full Local Docker
                         ML + RAG Backend

The project is designed to be both portfolio-friendly as a free hosted
demo and reproducible as a complete local AI system.