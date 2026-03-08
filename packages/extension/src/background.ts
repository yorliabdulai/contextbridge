import { v4 as uuidv4 } from 'uuid';

chrome.runtime.onInstalled.addListener(() => {
  // Generate userId once on install, sync across devices via Chrome
  chrome.storage.sync.get(['userId'], (result) => {
    if (!result.userId) {
      const userId = uuidv4();
      chrome.storage.sync.set({ userId });
      console.log('MemoryMesh: Generated userId', userId);
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_USER_ID') {
    chrome.storage.sync.get(['userId'], (result) => {
      sendResponse({ userId: result.userId });
    });
    return true;
  }
});