# SupportOps AI

AI-Powered Customer Support Intelligence & Resolution Platform.

SupportOps AI is an end-to-end Machine Learning and Generative AI project designed to automate customer support ticket analysis, predict operational risks, retrieve relevant knowledge, and generate grounded resolution recommendations.

## Planned Capabilities

- Customer support ticket classification
- Sentiment analysis
- Ticket priority prediction
- SLA breach prediction
- Explainable AI
- Retrieval-Augmented Generation (RAG)
- LLM-powered resolution recommendations
- Interactive analytics dashboard
- Model monitoring
- REST API deployment
- MLOps and CI/CD

## Planned Technology Stack

- Python
- Scikit-learn
- PyTorch
- Hugging Face Transformers
- FastAPI
- PostgreSQL / pgvector
- MLflow
- Docker
- React / Next.js
- Azure

## Project Status

🚧 Currently under development.

## Current Progress

### Phase 1 — Dataset Exploration & Baseline NLP Classification

An initial customer-support dataset containing 8,469 tickets was evaluated
for automated ticket-type classification.

Data-quality analysis identified:

- 85 unique ticket texts associated with multiple target labels
- 205 rows affected by conflicting labels
- Exact duplicate ticket descriptions
- 29 exact ticket texts initially appearing across both training and test sets
- Highly templated ticket descriptions with weak alignment between text and target labels

After removing conflicting records and exact duplicates, the final modelling
dataset contained 8,240 unique ticket texts with zero exact train/test overlap.

### Baseline Model

A baseline NLP classifier was developed using:

- TF-IDF text vectorization
- Unigrams and bigrams
- Logistic Regression
- Stratified 80/20 train-test split

Results after data-quality corrections:

| Metric | Score |
|---|---:|
| Accuracy | 19.54% |
| Macro Precision | 19.63% |
| Macro Recall | 19.54% |
| Macro F1 | 19.53% |

With five approximately balanced target classes, random-chance accuracy is
approximately 20%. Error analysis showed that ticket subjects and descriptions
were weakly associated with the provided ticket-type labels.

For example, tickets with the subject "Refund request" were distributed across
all five target classes rather than predominantly belonging to the
"Refund request" class.

### Decision

The dataset will therefore not be used as the primary training source for the
SupportOps AI ticket-intent classifier.

It will instead be retained for operational analytics and dashboard development,
while a more consistently labelled intent-classification dataset will be used
for the NLP modelling component.