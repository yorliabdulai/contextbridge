import JSZip from 'jszip';
import { getUserId, summarizeAndSave } from '../utils/api';

// ─── ChatGPT types ───────────────────────────────────────────────
interface ChatGPTMessage {
  author: { role: string };
  content: { parts: string[] };
}
interface ChatGPTConversation {
  title: string;
  create_time: number;
  mapping: Record<string, { message?: ChatGPTMessage }>;
}

// ─── Claude types ────────────────────────────────────────────────
interface ClaudeMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
}
interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  chat_messages: ClaudeMessage[];
}

// ─── UI helpers ──────────────────────────────────────────────────
function showSection(id: string) {
  ['progress-section', 'success-section', 'error-section'].forEach(s => {
    document.getElementById(s)?.classList.add('hidden');
  });
  document.getElementById(id)?.classList.remove('hidden');
}

function addLog(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const log = document.getElementById('progress-log');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  log.prepend(entry);
}

function updateProgress(current: number, total: number) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  (document.getElementById('progress-fill') as HTMLElement).style.width = `${pct}%`;
  (document.getElementById('progress-count') as HTMLElement).textContent = `${current} / ${total}`;
}

// ─── ChatGPT parser ──────────────────────────────────────────────
function parseChatGPT(conversations: ChatGPTConversation[]): { title: string; content: string }[] {
  return conversations
    .filter(c => Object.values(c.mapping).filter(n => n.message).length >= 2)
    .map(c => {
      const messages = Object.values(c.mapping)
        .filter(n => n.message?.content?.parts)
        .map(n => {
          const role = n.message!.author.role === 'user' ? 'User' : 'Assistant';
          const text = n.message!.content.parts.join(' ').trim();
          return text ? `${role}: ${text}` : null;
        })
        .filter(Boolean)
        .slice(0, 20)
        .join('\n');
      return { title: c.title || 'Untitled', content: `Title: ${c.title}\n\n${messages}` };
    });
}

// ─── Claude parser ───────────────────────────────────────────────
function parseClaude(conversations: ClaudeConversation[]): { title: string; content: string }[] {
  return conversations
    .filter(c => c.chat_messages?.length >= 2)
    .map(c => {
      const messages = c.chat_messages
        .slice(0, 20)
        .map(m => {
          const role = m.sender === 'human' ? 'User' : 'Assistant';
          return m.text?.trim() ? `${role}: ${m.text.trim()}` : null;
        })
        .filter(Boolean)
        .join('\n');
      return { title: c.name || 'Untitled', content: `Title: ${c.name}\n\n${messages}` };
    });
}

// ─── Detect source & parse ───────────────────────────────────────
async function detectAndParse(zip: JSZip): Promise<{ source: 'claude' | 'chatgpt' | 'gemini' | 'other'; items: { title: string; content: string }[] }> {
  // Claude export: has conversations.json with claude structure
  const claudeFile = zip.file('conversations.json');
  if (claudeFile) {
    const raw = await claudeFile.async('string');
    const data = JSON.parse(raw);
    // Distinguish Claude vs ChatGPT by checking first item's shape
    if (Array.isArray(data) && data[0]?.chat_messages !== undefined) {
      return { source: 'claude', items: parseClaude(data as ClaudeConversation[]) };
    }
    // ChatGPT also has conversations.json but uses 'mapping'
    if (Array.isArray(data) && data[0]?.mapping !== undefined) {
      return { source: 'chatgpt', items: parseChatGPT(data as ChatGPTConversation[]) };
    }
  }
  throw new Error('Unrecognised export format. Expected ChatGPT or Claude data export.');
}

// ─── Main ────────────────────────────────────────────────────────
async function processZip(file: File) {
  const userId = await getUserId();
  showSection('progress-section');

  const titleEl = document.getElementById('progress-title')!;
  titleEl.textContent = 'Reading ZIP file...';

  const zip = await JSZip.loadAsync(file);
  const { source, items } = await detectAndParse(zip);

  titleEl.textContent = `Importing ${items.length} conversations from ${source === 'claude' ? 'Claude' : 'ChatGPT'}...`;
  updateProgress(0, items.length);

  let success = 0, failed = 0;

  for (let i = 0; i < items.length; i++) {
    const { title, content } = items[i];
    try {
      await summarizeAndSave(userId, source, content);
      success++;
      addLog(`✓ ${title.slice(0, 60)}`, 'success');
    } catch {
      failed++;
      addLog(`✗ Failed: ${title.slice(0, 40)}`, 'error');
    }
    updateProgress(i + 1, items.length);
    await new Promise(r => setTimeout(r, 300));
  }

  showSection('success-section');
  document.getElementById('success-title')!.textContent = 'Import Complete!';
  document.getElementById('success-body')!.textContent =
    `${success} conversations from ${source === 'claude' ? 'Claude' : 'ChatGPT'} imported${failed > 0 ? `, ${failed} failed` : ''}.`;
}

// ─── Event listeners ─────────────────────────────────────────────
const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', async e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer?.files[0];
  if (file?.name.endsWith('.zip')) await processZip(file);
});

fileInput.addEventListener('change', async () => {
  if (fileInput.files?.[0]) await processZip(fileInput.files[0]);
});

document.getElementById('done-btn')?.addEventListener('click', () => window.close());
document.getElementById('retry-btn')?.addEventListener('click', () => {
  ['progress-section', 'success-section', 'error-section'].forEach(s =>
    document.getElementById(s)?.classList.add('hidden'));
});