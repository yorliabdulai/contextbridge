const API_BASE = 'https://6lshpyi018.execute-api.eu-west-2.amazonaws.com';

export interface ContextEntry {
  entryId?: string;
  userId: string;
  source: 'claude' | 'chatgpt' | 'gemini' | 'other';
  content: string;
  summary: string;
  tags: string[];
  createdAt?: string;
}

export async function getContext(userId: string, limit = 1000): Promise<string> {
  const res = await fetch(`${API_BASE}/context/${userId}?limit=${limit}`);
  const data = await res.json();
  return data.content?.[0]?.text || 'No context found.';
}

export async function saveContext(entry: ContextEntry): Promise<void> {
  await fetch(`${API_BASE}/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export async function searchMemory(userId: string, query: string): Promise<string> {
  const res = await fetch(`${API_BASE}/search/${userId}?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.content?.[0]?.text || 'No results.';
}

export async function getUserId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['memorymesh_user_id'], (result) => {
      if (result.memorymesh_user_id) {
        resolve(result.memorymesh_user_id);
      } else {
        const newId = 'mm-' + crypto.randomUUID();
        chrome.storage.local.set({ memorymesh_user_id: newId }, () => {
          resolve(newId);
        });
      }
    });
  });
}

export async function summarizeAndSave(
  userId: string,
  source: 'claude' | 'chatgpt' | 'gemini' | 'other',
  rawContent: string
): Promise<void> {
  // Step 1 — get structured summary from Bedrock via API
  let summary = rawContent.slice(0, 120);
  let tags = [source, 'session'];

  try {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: rawContent, source }),
    });
    const structured = await res.json();
    summary = structured.summary || summary;
    tags = [
      ...(structured.tags || []),
      ...(structured.projects || []),
      source,
    ];
  } catch {
    // Fall through to save with basic summary
  }

  // Step 2 — save enriched context
  await saveContext({
    userId,
    source,
    content: rawContent,
    summary,
    tags,
  });
}