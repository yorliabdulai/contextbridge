import { getContext, summarizeAndSave, getUserId } from '../utils/api';

const BANNER_ID = 'memorymesh-banner';

async function injectContextBanner() {
  if (document.getElementById(BANNER_ID)) return;

  const userId = await getUserId();
  const context = await getContext(userId, 1000);

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: #e0e0e0;
    padding: 12px 20px;
    font-size: 13px;
    font-family: -apple-system, sans-serif;
    z-index: 999999;
    border-bottom: 1px solid #4a9eff33;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  banner.innerHTML = `
    <span style="color:#4a9eff;font-weight:600;">⬡ MemoryMesh</span>
    <span style="flex:1;opacity:0.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      ${context.split('\n')[0]}
    </span>
    <button id="memorymesh-save-btn" style="
      background:#4a9eff;color:white;border:none;
      padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;
    ">Save Context</button>
    <button id="memorymesh-close" style="
      background:transparent;color:#999;border:none;cursor:pointer;font-size:16px;
    ">×</button>
  `;

  document.body.prepend(banner);
  document.body.style.marginTop = '44px';

  // Use the banner element directly — guaranteed to exist
  banner.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    if (target.id === 'memorymesh-close') {
      banner.remove();
      document.body.style.marginTop = '';
      return;
    }

    if (target.id === 'memorymesh-save-btn') {
      const btn = target as HTMLButtonElement;
      btn.textContent = 'Analysing...';
      btn.disabled = true;
      btn.style.background = '#f59e0b';

      try {
        const userMessages = Array.from(document.querySelectorAll(
          '[data-message-author-role="user"]'
        )).map(el => el.textContent?.trim()).filter(Boolean);

        const aiMessages = Array.from(document.querySelectorAll(
          '[data-message-author-role="assistant"]'
        )).slice(0, 3).map(el => el.textContent?.trim()).filter(Boolean);

        const rawContent = [...userMessages, ...aiMessages]
          .join('\n')
          .slice(0, 3000);

        await summarizeAndSave(userId, 'chatgpt', rawContent || 'ChatGPT session');

        btn.textContent = '✓ Saved!';
        btn.style.background = '#22c55e';
        btn.disabled = false;

        // Reset after 3 seconds
        setTimeout(() => {
          btn.textContent = 'Save Context';
          btn.style.background = '#4a9eff';
        }, 3000);

      } catch (err) {
        console.error('MemoryMesh save error:', err);
        btn.textContent = 'Error';
        btn.style.background = '#ef4444';
        btn.disabled = false;
      }
    }
  });
}

injectContextBanner();

const observer = new MutationObserver(() => {
  if (!document.getElementById(BANNER_ID)) {
    injectContextBanner();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'INJECT_CONTEXT') {
    try {
      const input = document.querySelector('#prompt-textarea') as HTMLElement;

      if (input) {
        const primer = `[MemoryMesh Context]\n${message.context}\n\n[End Context — please acknowledge you have this context and continue from here]`;
        input.focus();
        document.execCommand('insertText', false, primer);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    } catch {
      sendResponse({ success: false });
    }
    return true;
  }
});