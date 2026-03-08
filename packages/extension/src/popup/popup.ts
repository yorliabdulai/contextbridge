import { getContext, searchMemory, getUserId } from '../utils/api';

type AITool = 'claude' | 'chatgpt' | 'gemini' | null;

function detectAITool(url: string): AITool {
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('gemini.google.com')) return 'gemini';
  return null;
}

function showStatus(message: string, type: 'success' | 'error') {
  const bar = document.getElementById('statusBar') as HTMLDivElement;
  bar.textContent = message;
  bar.className = `status-bar ${type}`;
  setTimeout(() => { bar.className = 'status-bar hidden'; }, 3000);
}

async function init() {
  const userIdDisplay = document.getElementById('userId') as HTMLElement;
  const contextOutput = document.getElementById('contextOutput') as HTMLDivElement;
  const syncBtn = document.getElementById('syncBtn') as HTMLButtonElement;

  const userId = await getUserId();
  userIdDisplay.textContent = userId;

  // Copy ID
  document.getElementById('copyUserId')?.addEventListener('click', () => {
    navigator.clipboard.writeText(userId);
    const btn = document.getElementById('copyUserId') as HTMLButtonElement;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });

  // Load context
  let loadedContext = '';
  contextOutput.textContent = 'Loading...';
  try {
    loadedContext = await getContext(userId, 1000);
    contextOutput.textContent = loadedContext;
    syncBtn.disabled = false;
  } catch {
    contextOutput.textContent = 'Could not connect to MemoryMesh API.';
  }

  // Detect current tab's AI tool
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    const tool = detectAITool(url);
    if (tool) {
      syncBtn.textContent = `⬡ Sync to ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
    } else {
      syncBtn.textContent = '⬡ Open an AI tool to sync';
      syncBtn.disabled = true;
    }
  });

  // Sync button — inject context into active AI tab
  syncBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      const tool = detectAITool(tab.url || '');
      if (!tool) {
        showStatus('Open Claude, ChatGPT, or Gemini first', 'error');
        return;
      }

      syncBtn.textContent = 'Syncing...';
      syncBtn.disabled = true;

      // Send context to content script for injection
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'INJECT_CONTEXT', context: loadedContext },
        (response) => {
          if (chrome.runtime.lastError) {
            showStatus('Could not inject — try refreshing the page', 'error');
          } else if (response?.success) {
            showStatus(`✓ Context synced to ${tool}!`, 'success');
          } else {
            showStatus('Injection failed — page may not be ready', 'error');
          }
          syncBtn.disabled = false;
          syncBtn.textContent = `⬡ Sync to ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
        }
      );
    });
  });

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', async () => {
    const query = (document.getElementById('searchQuery') as HTMLInputElement).value.trim();
    if (!query) return;

    const searchOutput = document.getElementById('searchOutput') as HTMLDivElement;
    searchOutput.classList.remove('hidden');
    searchOutput.textContent = 'Searching...';

    try {
      const results = await searchMemory(userId, query);
      searchOutput.textContent = results;
    } catch {
      searchOutput.textContent = 'Search failed.';
    }
  });

  document.getElementById('import-btn')?.addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('import/index.html')
  });
});
}

init();