(async () => {
    const selector = '[data-message-author-role="assistant"]';
    const anchor = window.getSelection()?.anchorNode;
    const selected = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
    const reply = selected?.closest(selector) || Array.from(document.querySelectorAll(selector)).pop();
    return globalThis.copyAnswerForSiYuan(reply);
})();