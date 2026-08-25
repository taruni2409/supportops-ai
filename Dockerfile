FROM python:3.11-slim

WORKDIR /app

# Required system packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for Docker layer caching
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api ./api
COPY ml ./ml
COPY rag ./rag
COPY knowledge_base ./knowledge_base

# The API runs on port 8001
EXPOSE 8001

# Important for our PyTorch + XGBoost runtime
ENV OMP_NUM_THREADS=1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]