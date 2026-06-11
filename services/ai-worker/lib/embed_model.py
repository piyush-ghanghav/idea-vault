import os
from fastembed import TextEmbedding

cache_path = os.getenv("FASTEMBED_CACHE_PATH", "/home/piyush/.cache/fastembed")
embed_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    cache_dir=cache_path
)