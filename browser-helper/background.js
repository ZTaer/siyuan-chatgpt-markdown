chrome.action.onClicked.addListener(async tab => {
    if (!tab.id) return;
    try {
        if (!/^https:\/\/(?:chatgpt\.com|chat\.openai\.com)\//.test(tab.url || "")) throw Error("请在 ChatGPT 回答页使用");
        const [result] = await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ["answer.js", "copy.js"]});
        if (result.result !== true) throw Error(result.result || "复制失败，请重新点击");
        await chrome.action.setTitle({tabId: tab.id, title: "已复制，可以在思源正文中粘贴"});
        await chrome.action.setBadgeText({tabId: tab.id, text: "✓"});
    } catch (error) {
        await chrome.action.setTitle({tabId: tab.id, title: String(error.message)});
        await chrome.action.setBadgeText({tabId: tab.id, text: "!"});
    }
});
