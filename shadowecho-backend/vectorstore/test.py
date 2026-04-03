import httpx
resp = httpx.post(
    "http://localhost:11434/api/embed",
    json={"model": "bge-m3:567m", "input": ["test sentence"]},
    timeout=30
)
print(resp.status_code, resp.json())