globalThis.copyAnswerForSiYuan = async function (reply) {
    if (!reply) return "没有找到回答，请在包含回答的 ChatGPT 对话页使用";
    const copy = reply.cloneNode(true);
    const images = copy.querySelectorAll("img");
    const liveImages = reply.querySelectorAll("img");
    for (const [index, img] of Array.from(images).entries()) {
        const src = liveImages[index].currentSrc || liveImages[index].src;
        if (!src.startsWith("blob:")) continue;
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            if (!response.ok || !blob.type.startsWith("image/")) return "图片尚未载入，请稍后重试";
            const reader = new FileReader();
            img.src = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            img.removeAttribute("srcset");
        } catch { return "未能读取回答中的临时图片，请等图表加载后重试"; }
    }
    const originals = reply.querySelectorAll("svg");
    copy.querySelectorAll("svg").forEach((svg, index) => {
        if (svg.parentElement?.closest("svg") || !copy.contains(svg)) return;
        const isDiagram = svg.matches('[id*="mermaid" i], [aria-roledescription]') || svg.closest(".mermaid");
        if (svg.closest(".katex") || (!isDiagram && svg.closest('button,[role="button"]')) ||
            (svg.getAttribute("aria-hidden") === "true" && !svg.querySelector("text,foreignObject"))) {
            svg.remove();
            return;
        }
        // Preserve the drawn diagram before the browser or an intermediate
        // Markdown exporter can flatten it into stylesheet text and labels.
        const original = originals[index];
        const live = [original, ...original.querySelectorAll("*")];
        [svg, ...svg.querySelectorAll("*")].forEach((shape, n) => {
            if (shape.namespaceURI !== "http://www.w3.org/2000/svg" || shape.localName === "style") return;
            const css = getComputedStyle(live[n]);
            for (const name of ["fill", "stroke", "stroke-width", "color", "font-size", "font-family", "text-anchor"]) {
                const value = css.getPropertyValue(name);
                if (value && !value.includes("url(")) shape.style.setProperty(name, value);
            }
        });
        const img = document.createElement("img");
        img.alt = svg.querySelector("title")?.textContent || svg.getAttribute("aria-label") || "图表";
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        svg.replaceWith(img);
    });
    copy.querySelectorAll('script,style').forEach(el => el.remove());
    // Some diagram viewers make the whole picture a zoom button.
    // Discard the button itself, keeping the diagram(s) inside it.
    copy.querySelectorAll('button,[role="button"],[aria-hidden="true"]:not(img)').forEach(el => {
        if (copy.contains(el)) el.replaceWith(...el.querySelectorAll('img[src^="data:image/" i]'));
    });
    const html = copy.innerHTML;
    const plain = reply.innerText;
    let copied = false;
    const write = event => {
        if (!event.clipboardData) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        event.clipboardData.setData("text/plain", plain);
        event.clipboardData.setData("text/html", html);
        copied = true;
    };
    window.addEventListener("copy", write, true);
    try {
        return document.execCommand("copy") && copied || "浏览器未写入剪贴板，请点击页面后重试";
    } finally {
        window.removeEventListener("copy", write, true);
    }
};
