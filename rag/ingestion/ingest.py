from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

KNOWLEDGE_BASE_PATH = PROJECT_ROOT / "knowledge_base"
CHROMA_PATH = PROJECT_ROOT / "rag" / "chroma_db"

COLLECTION_NAME = "novabank_support_policies"

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# ============================================================
# Load embedding model
# ============================================================

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL_NAME
)


# ============================================================
# Connect to ChromaDB
# ============================================================

print("Connecting to ChromaDB...")

chroma_client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

# Create the collection if it does not already exist.
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={
        "hnsw:space": "cosine"
    }
)


# ============================================================
# Read knowledge-base documents
# ============================================================

documents = []
metadatas = []
ids = []

print(f"\nReading documents from: {KNOWLEDGE_BASE_PATH}")


for file_path in sorted(KNOWLEDGE_BASE_PATH.glob("*.md")):

    print(f"Reading: {file_path.name}")

    text = file_path.read_text(
        encoding="utf-8"
    ).strip()

    if not text:
        continue

    # --------------------------------------------------------
    # Simple chunking
    # --------------------------------------------------------
    #
    # We initially split using Markdown sections.
    # This keeps related policy information together.
    #

    sections = text.split("\n## ")

    for index, section in enumerate(sections):

        section = section.strip()

        if not section:
            continue

        # Restore Markdown heading if it was removed
        if index > 0:
            section = "## " + section

        chunk_id = f"{file_path.stem}_{index}"

        documents.append(section)

        metadatas.append(
            {
                "source": file_path.name,
                "document": file_path.stem,
                "chunk": index,
            }
        )

        ids.append(chunk_id)


# ============================================================
# Check what we found
# ============================================================

print(f"\nTotal chunks created: {len(documents)}")

if not documents:
    raise RuntimeError(
        "No Markdown documents were found in knowledge_base/"
    )


# ============================================================
# Generate embeddings
# ============================================================

print("\nGenerating embeddings...")

embeddings = embedding_model.encode(
    documents,
    normalize_embeddings=True,
    show_progress_bar=True,
)


# ============================================================
# Store in ChromaDB
# ============================================================

print("\nAdding documents to ChromaDB...")

collection.upsert(
    ids=ids,
    documents=documents,
    embeddings=embeddings.tolist(),
    metadatas=metadatas,
)


# ============================================================
# Finished
# ============================================================

print("\n========================================")
print("RAG ingestion completed successfully!")
print("========================================")

print(f"Collection : {COLLECTION_NAME}")
print(f"Documents  : {len(documents)}")
print(f"ChromaDB   : {CHROMA_PATH}")