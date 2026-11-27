(() => {
    const nativeFallback = new WeakSet();
    const assistant = '[data-message-author-role="assistant"]';
    const copyButton = 'button[data-testid="copy-turn-action-button"],button[aria-label="复制回答"],button[aria-label="Copy response" i]';
    const previews = 'svg[id*="mermaid" i], svg[aria-roledescription], .mermaid svg, img[src^="data:image/svg+xml" i]';

    window.addEventListener("click", async event => {
        const button = event.target.closest?.(copyButton);
        if (!button || nativeFallback.has(button) || event.shiftKey) return;
        const turn = button.closest('[data-testid^="conversation-turn-"], [data-turn="assistant"], article');
        const replies = turn?.querySelectorAll(assistant);
        const reply = button.closest(assistant) || (replies?.length === 1 && replies[0]);
        if (!reply || !reply.querySelector(previews)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        try {
            if (await globalThis.copyAnswerForSiYuan(reply) !== true) throw Error("未写入图文");
            button.setAttribute("title", "图文已复制，可粘贴到思源");
        } catch {
            nativeFallback.add(button);
            try { button.click(); }
            finally { nativeFallback.delete(button); }
        }
    }, true);
})();
