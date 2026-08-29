FROM python:3.11-slim

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

# FastAPI listens on port 8000 inside the container
EXPOSE 8000

# Keep PyTorch + XGBoost CPU runtime stable
ENV OMP_NUM_THREADS=1

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
