/* 钱进 v0.2 后台：迁移、可选网站权限、动态内容脚本和老板键。 */
'use strict';
importScripts('storage.js');

const SCRIPT_ID = 'qj-widget-v2';
const SCRIPT_FILES = ['src/currency.js', 'src/calendar.js', 'src/storage.js', 'src/engine.js', 'src/hamster.js', 'src/audio.js', 'src/payout-motion.js', 'src/content.js'];
let lastClaimedPayout = '';

async function hasHostAccess() {
  try { return await chrome.permissions.contains({ origins: ['<all_urls>'] }); }
  catch (e) { return false; }
}
async function unregisterWidget() {
  try { await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] }); }
  catch (e) {}
}
async function registerWidget() {
  if (!(await hasHostAccess())) { await unregisterWidget(); return false; }
  await unregisterWidget();
  try {
    await chrome.scripting.registerContentScripts([{
      id: SCRIPT_ID,
      matches: ['<all_urls>'],
      js: SCRIPT_FILES,
      runAt: 'document_idle',
      allFrames: false,
      persistAcrossSessions: true
    }]);
    return true;
  } catch (e) { return false; }
}
async function injectActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id === undefined || !/^https?:/i.test(tab.url || '')) return;
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPT_FILES });
  } catch (e) {}
}
async function notifyTabs(message) {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.filter((tab) => tab.id !== undefined).map((tab) =>
      chrome.tabs.sendMessage(tab.id, message).catch(() => {})
    ));
  } catch (e) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await QJStorage.load();
  await chrome.storage.local.set(data);
  await registerWidget();
});
chrome.runtime.onStartup.addListener(registerWidget);
chrome.permissions.onAdded.addListener(async (permissions) => {
  if ((permissions.origins || []).includes('<all_urls>')) {
    // 即使权限对话使 popup 被关闭，后台也会把挂件开关与已授权状态对齐。
    const data = await QJStorage.load();
    data.settings.widget.enabled = true;
    await chrome.storage.local.set({ settings: data.settings });
    await registerWidget(); await injectActiveTab();
  }
});
chrome.permissions.onRemoved.addListener(async (permissions) => {
  if ((permissions.origins || []).includes('<all_urls>')) {
    await unregisterWidget();
    const data = await QJStorage.load();
    data.settings.widget.enabled = false;
    await chrome.storage.local.set({ settings: data.settings });
    await notifyTabs({ type: 'QJ_DESTROY' });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;
  if (message.type === 'QJ_CLAIM_PAYOUT') {
    const key = String(message.key || '');
    const play = !!key && key !== lastClaimedPayout;
    if (play) lastClaimedPayout = key;
    sendResponse({ play });
    return;
  }
  if (message.type === 'QJ_OPEN_SETTINGS') {
    (async () => {
      try {
        await chrome.windows.create({
          url: chrome.runtime.getURL('src/popup.html?view=Settings'),
          type: 'popup', width: 380, height: 620, focused: true
        });
        sendResponse({ ok: true });
      } catch (e) { sendResponse({ ok: false }); }
    })();
    return true;
  }
  if (message.type !== 'QJ_REFRESH_REGISTRATION') return;
  (async () => {
    const registered = await registerWidget();
    if (registered) await injectActiveTab();
    sendResponse({ ok: registered });
  })();
  return true;
});
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'boss-key') return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id !== undefined) await chrome.tabs.sendMessage(tab.id, { type: 'QJ_TOGGLE_BOSS' });
  } catch (e) {}
});
