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

## BANKING77 Intent Classification

After identifying label-quality issues in the initial customer-support dataset,
BANKING77 was selected as the primary dataset for SupportOps AI intent
classification.

### Dataset

- 10,003 official training examples
- 3,080 official test examples
- 77 customer-support intents
- 7 normalized queries overlapped between the official training and test sets
- A strict evaluation set was created with zero normalized train/test overlap

### Baseline Model

The first BANKING77 baseline used:

- TF-IDF text vectorization
- Unigrams and bigrams
- Logistic Regression
- 77-class intent classification

Baseline performance:

| Evaluation | Accuracy | Macro F1 |
|---|---:|---:|
| Official Test | 85.88% | 85.81% |
| Strict Zero-Overlap Test | 85.84% | 85.76% |

The very small difference between the official and strict evaluations indicates
that the overlapping examples did not materially inflate model performance.

### Hyperparameter Tuning

The classical model was further optimized using:

- Stratified train/validation splitting
- 3-fold Stratified Cross-Validation
- GridSearchCV
- Macro F1 as the model-selection metric
- TF-IDF n-gram tuning
- Minimum document-frequency tuning
- Sublinear term-frequency tuning
- Logistic Regression regularization tuning

The best configuration identified during cross-validation was:

- `ngram_range = (1, 1)`
- `min_df = 1`
- `sublinear_tf = True`
- `C = 4.0`

Best cross-validation Macro F1: approximately **86.67%**.

> Final tuned-model validation and test results are recorded in the experiment
> notebook and will be compared against Transformer-based models in the next phase.

### Next Phase

The next stage will fine-tune a Transformer model for the same 77-class intent
classification task and compare it against the TF-IDF + Logistic Regression
baseline.