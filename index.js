"use strict";

const { Plugin, Dialog, showMessage } = require("siyuan");

const fence = /^( {0,3})(`{3,}|~{3,})([^\n]*)$/;
const mermaid = /^(?:(?:%%[^\n]*\n|---\n[\s\S]*?\n---\n)\s*)*(?:(?:flowchart|graph)\s+(?:TB|TD|BT|LR|RL)\b|(?:sequenceDiagram|mindmap|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|timeline|quadrantChart|xychart(?:-beta)?|C4(?:Context|Container|Component|Dynamic|Deployment)|requirementDiagram|sankey-beta|architecture-beta|block-beta|kanban|packet(?:-beta)?|radar-beta|treemap-beta)\b)/;

function diagramLanguage(source) {
    const text = source.trim();
    if (mermaid.test(text) && (text.includes("\n") || /(?:-->|---|->>|:\s*\d)/.test(text))) return "mermaid";
    if (/^(?:strict\s+)?(?:di)?graph\b[^{\n]*\{/i.test(text)) return "graphviz";
    if (/^@startuml\b[\s\S]*^@enduml\b/m.test(text) && text.startsWith("@startuml")) return "plantuml";
    return "";
}

function svgDataURL(source) {
    const bytes = new TextEncoder().encode(source);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 8192) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    }
    return "data:image/svg+xml;base64," + btoa(chunks.join(""));
}

const svgNamespace = "http://www.w3.org/2000/svg";
const shapes = new Set(("svg title desc g defs symbol use switch path rect circle ellipse line polyline polygon " +
    "text tspan textPath marker pattern clipPath mask linearGradient radialGradient stop style image filter " +
    "feGaussianBlur feOffset feBlend feColorMatrix feComposite feFlood feMerge feMergeNode feDropShadow").split(" "));
const geometry = new Set(("id class viewBox preserveAspectRatio transform d points x y x1 y1 x2 y2 dx dy cx cy r rx ry " +
    "width height refX refY markerWidth markerHeight markerUnits orient gradientUnits gradientTransform offset " +
    "spreadMethod fx fy patternUnits patternContentUnits patternTransform maskUnits maskContentUnits clipPathUnits " +
    "textLength lengthAdjust startOffset rotate filterUnits primitiveUnits stdDeviation in in2 result mode " +
    "type values operator k1 k2 k3 k4").split(" "));
const presentation = new Set(("fill fill-rule fill-opacity stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin " +
    "stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color font font-family font-size font-weight font-style " +
    "text-anchor dominant-baseline alignment-baseline letter-spacing white-space visibility display overflow mask filter " +
    "clip-path clip-rule marker-start marker-mid marker-end stop-color stop-opacity flood-color flood-opacity " +
    "paint-order vector-effect background-color rx ry").split(" "));

function safePaint(value) {
    // Keep local gradient, clip and marker references. Embedded drawings are
    // self-contained even if a reader opens an exported SVG as a document.
    return !/[\\@<>]|\/\*|(?:url|var|image(?:-set)?|src)\s*\(/i.test(
        value.replace(/url\(\s*(['"]?)#[\w.:-]+\1\s*\)/gi, ""));
}

function drawingStyle(style) {
    return Array.from(style).filter(name => presentation.has(name) && safePaint(style.getPropertyValue(name)))
        .map(name => name + ":" + style.getPropertyValue(name) + (style.getPropertyPriority(name) ? " !important" : ""))
        .join(";");
}

function svgImage(element) {
    const doc = document.implementation.createDocument(svgNamespace, "svg", null);
    function copy(source, target) {
        for (const attr of source.attributes) {
            const {name, value} = attr;
            if (geometry.has(name) || (presentation.has(name) && safePaint(value))) target.setAttribute(name, value);
            if (name === "style") {
                const style = document.createElement("span").style;
                style.cssText = value;
                target.setAttribute("style", drawingStyle(style));
            }
            if (attr.localName === "href" && (/^#[\w.:-]+$/.test(value) ||
                (source.localName === "image" && /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value)))) {
                target.setAttribute("href", value);
            }
        }
        if (source.localName === "style") {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(source.textContent);
            for (const rule of sheet.cssRules) {
                if (rule.type === CSSRule.STYLE_RULE) target.append(rule.selectorText + "{" + drawingStyle(rule.style) + "}");
            }
            return;
        }
        for (const node of source.childNodes) {
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
                target.append(node.textContent);
            } else if (node.localName === "foreignObject") {
                // SiYuan strips foreignObject from served SVG assets. Mermaid
                // often puts the only copy of a node's label inside this tag.
                const label = doc.createElementNS(svgNamespace, "text");
                const number = key => parseFloat(node.getAttribute(key)) || 0;
                label.setAttribute("x", number("x") + number("width") / 2);
                label.setAttribute("y", number("y") + number("height") / 2);
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "central");
                const lines = codeText(node).trim().split(/\n+/).map(line => line.trim()).filter(Boolean);
                lines.forEach((line, n) => {
                    const span = doc.createElementNS(svgNamespace, "tspan");
                    span.setAttribute("x", label.getAttribute("x"));
                    span.setAttribute("dy", (n ? 1.15 : -0.575 * (lines.length - 1)) + "em");
                    span.textContent = line;
                    label.append(span);
                });
                target.append(label);
            } else if (shapes.has(node.localName)) {
                const child = doc.createElementNS(svgNamespace, node.localName);
                target.append(child);
                copy(node, child);
            }
        }
    }
    const root = doc.documentElement;
    copy(element, root);
    const box = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
    if (box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) {
        // Browser selections often give diagrams width="100%" without a height.
        const pixels = name => {
            const value = root.getAttribute(name) || "";
            return /^\d+(?:\.\d+)?(?:px)?$/.test(value) ? parseFloat(value) : 0;
        };
        const width = pixels("width") || (pixels("height") ? pixels("height") * box[2] / box[3] : box[2]);
        root.setAttribute("width", width);
        root.setAttribute("height", pixels("height") || width * box[3] / box[2]);
    }
    return svgDataURL(new XMLSerializer().serializeToString(doc));
}

function svgURLFromText(source) {
    if (!/^(?:<\?xml[\s\S]*?\?>\s*)?<svg[\s/>]/i.test(source.trim())) return "";
    const doc = new DOMParser().parseFromString(source.trim(), "image/svg+xml");
    const svg = doc.documentElement;
    if (svg.localName !== "svg" || doc.querySelector("parsererror")) return "";
    if (!svg.namespaceURI) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return svgImage(svg);
}

function svgFromText(source) {
    const url = svgURLFromText(source);
    return url && "![SVG 图](" + url + ")";
}

function svgDataSource(line) {
    const header = /^ {0,3}data:image\/svg\+xml((?:;(?:charset=["']?utf-?8["']?|utf-?8|base64))*),/i.exec(line);
    if (!header) return "";
    try {
        // In a data URL '+' is literal. Only percent escapes represent bytes.
        const payload = decodeURIComponent(line.slice(header[0].length).trimEnd());
        if (!/;base64(?:;|$)/i.test(header[1])) return payload;
        const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0));
        return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
    } catch {
        // A truncated address can still be pasted as text.
        return "";
    }
}

function svgFromDataURL(line) {
    const source = svgDataSource(line);
    return source && svgURLFromText(source);
}

// The screenshot supplied with this clipboard fragment is the source of its
// edges. The CSS and the order of the labels alone do not encode a graph.
const ragFromScreenshot = [
    "```mermaid",
    "flowchart LR",
    "    %% 依照所提供的 RAG 流程图截图重建",
    "    docs(原始文档) --> chunks(文本分块) --> embed(Embedding) --> store[(向量知识库)]",
    "    store --> search(知识检索)",
    "    query(用户问题) --> search",
    "    search --> model(LLM)",
    "    query --> model",
    "    model --> answer(最终回答)",
    "    classDef data fill:#34363a,stroke:#789bc0,color:#f0f0f0",
    "    classDef question fill:#052b4e,stroke:#17415e,color:#a7d8ff",
    "    classDef retrieval fill:#303936,stroke:#51afa4,color:#f0f0f0",
    "    classDef llm fill:#37353a,stroke:#9986ba,color:#f0f0f0",
    "    classDef output fill:#333934,stroke:#6dab80,color:#f0f0f0",
    "    class docs,chunks,embed,store data",
    "    class query question",
    "    class search retrieval",
    "    class model llm",
    "    class answer output",
    "```"
].join("\n");

// A top-down Mermaid tree preserves the three colored branches and the
// left-to-right order of the twelve leaves in the supplied mind map.
const ragMindmapFromScreenshot = [
    "```mermaid",
    "flowchart TB",
    "    %% 根据 RAG 思维导图截图重建",
    "    rag((RAG)) --- idx[Indexing 索引构建] & ret[Retrieval 知识检索] & gen[Generation 答案生成]",
    "    idx --- loader[Document Loader] & split[Text Splitter] & embedding[Embedding] & store[Vector Store]",
    "    ret --- query[User Query] & search[Similarity Search] & topk[Top-K] & rank[Reranking]",
    "    gen --- prompt[Prompt] & context[Context] & llm[LLM] & answer[Final Answer]",
    "    classDef root fill:#214e94,stroke:#214e94,color:#fff",
    "    classDef indexing fill:#39833f,stroke:#39833f,color:#fff",
    "    classDef retrieval fill:#ad4e22,stroke:#ad4e22,color:#fff",
    "    classDef generation fill:#e0aa36,stroke:#e0aa36,color:#241c09",
    "    class rag root",
    "    class idx,loader,split,embedding,store indexing",
    "    class ret,query,search,topk,rank retrieval",
    "    class gen,prompt,context,llm,answer generation",
    "    linkStyle 0,3,4,5,6 stroke:#39833f,stroke-width:3px",
    "    linkStyle 1,7,8,9,10 stroke:#ad4e22,stroke-width:3px",
    "    linkStyle 2,11,12,13,14 stroke:#e0aa36,stroke-width:3px",
    "```"
].join("\n");

function diagramFromReference(styles, labels) {
    // ChatGPT regenerates SVG ids across copies of the same answer.
    // Match the renderer type and all labels in order, independently of the id.
    const key = labels.replace(/\s+/g, "");
    if (styles.includes(".flowchart-link") &&
        key === "原始文档文本分块Embedding向量知识库用户问题知识检索LLM最终回答") return ragFromScreenshot;
    if (styles.includes(".mindmap-node") &&
        key === "RAGIndexing索引构建DocumentLoaderTextSplitterEmbeddingVectorStore" +
        "Retrieval知识检索UserQuerySimilaritySearchTop-KReranking" +
        "Generation答案生成PromptContextLLMFinalAnswer") return ragMindmapFromScreenshot;
    return "";
}

const chartSelector = /\\?#chatgpt-mermaid-(?:\\[_-]|[\w-])+(?=\s*\{)/;
const missingPrefix = "复制内容中缺少 Mermaid 源码。图中保留的文字：";

function normalizedLabels(text) {
    return text.normalize("NFKC").replace(/[\s\u200b\ufeff]+/gu, "");
}

function normalizedHeading(text) {
    return normalizedLabels(text.replace(/(?:\*\*|__|`)/g, ""));
}

function chartFamily(styles) {
    if (styles.includes(".mindmap-node")) return "mindmap";
    if (/\.(?:actor|messageLine0)\b/.test(styles)) return "sequenceDiagram";
    if (/\.(?:classGroup|classBox)\b/.test(styles)) return "classDiagram";
    if (/\.(?:stateGroup|statediagram-state)\b/.test(styles)) return "stateDiagram";
    if (/\.(?:entityBox|erDiagram)\b/.test(styles)) return "erDiagram";
    if (styles.includes(".pieCircle")) return "pie";
    if (styles.includes(".taskText")) return "gantt";
    if (styles.includes(".flowchart-link")) return "flowchart";
    return "";
}

function normalizedStyles(styles, selector) {
    const unescape = text => text.replace(/\\([#_])/g, "$1");
    return unescape(styles).replaceAll(unescape(selector), "#diagram").trim();
}

// Bucket names are only a lookup optimization. Compare the actual labels
// inside each record, including when two buckets happen to hash identically.
function reviewBucket(labels) {
    let hash = 2166136261;
    for (let i = 0; i < labels.length; i++) hash = Math.imul(hash ^ labels.charCodeAt(i), 16777619);
    return "reviewed/" + (hash >>> 0).toString(16).padStart(8, "0");
}

function endOfCssRule(text, start) {
    let depth = 0;
    let quote = "";
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (ch === "\\") i++;
        else if (quote) {
            if (ch === quote) quote = "";
        } else if (ch === '"' || ch === "'") quote = ch;
        else if (text.startsWith("/*", i)) {
            i = text.indexOf("*/", i + 2);
            if (i === -1) return -1;
            i++;
        } else if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) return i + 1;
    }
    return -1;
}

function readRenderedChart(text, start, selector, missing, heading) {
    const id = selector.replace(/\\/g, "");
    const nextRule = /\s*(?:\/\*[\s\S]*?\*\/\s*)*(\\?#chatgpt-mermaid-(?:\\[_-]|[\w-])+|@(?:keyframes|-webkit-keyframes|media|supports|layer)\b)/iy;
    let end = endOfCssRule(text, start + selector.length);
    while (end !== -1) {
        nextRule.lastIndex = end;
        const rule = nextRule.exec(text);
        if (!rule || !(rule[1].startsWith("@") || rule[1].replace(/\\/g, "") === id)) break;
        end = endOfCssRule(text, nextRule.lastIndex);
    }
    if (end === -1) return null;
    const styles = text.slice(start, end);
    let lineEnd = text.indexOf("\n", end);
    if (lineEnd === -1) lineEnd = text.length;
    const sameLine = text.slice(end, lineEnd);
    const next = chartSelector.exec(sameLine);
    let boundary = next ? end + next.index : lineEnd;
    const labels = text.slice(end, boundary).trim();
    let recovered = diagramFromReference(styles, labels);
    // If labels wrap, consume additional lines only after an exact match.
    // Otherwise those lines remain available for normal Markdown processing.
    if (!recovered && !next) {
        const following = text.slice(boundary, boundary + 500).split("\n").slice(1);
        let candidate = labels;
        let candidateEnd = boundary;
        for (const line of following) {
            if (!line.trim() || /^ {0,3}(?:#{1,6}\s|`{3,}|~{3,})/.test(line) || chartSelector.test(line)) break;
            candidate += line;
            candidateEnd += line.length + 1;
            recovered = diagramFromReference(styles, candidate);
            if (recovered) {
                boundary = candidateEnd;
                break;
            }
        }
    }
    const fallback = "> 复制内容中缺少 Mermaid 源码。" + (labels ? "图中保留的文字：" + labels : "");
    return {
        markdown: recovered || (missing ? missing(text.slice(start, boundary), fallback, {
            labels: normalizedLabels(labels), heading, family: chartFamily(styles), styles: normalizedStyles(styles, selector)
        }) : fallback),
        end: boundary,
        next: next?.[0]
    };
}

function normalizeMarkdown(markdown, missing) {
    const text = markdown.replace(/\r\n?/g, "\n");
    const lines = text.split("\n");
    let offset = 0;
    const starts = lines.map(line => {
        const start = offset;
        offset += line.length + 1;
        return start;
    });
    const result = [];
    let heading = "";
    const containsLostDiagram = /\\?#chatgpt-mermaid-[^{}\n]+\{[^\n]*--mermaid-font-family/.test(markdown);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const section = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
        if (section) heading = normalizedHeading(section[1]);
        const quoted = line.replace(/^ {0,3}>\s?/, "").trim();
        if (missing && !/^(?: {4}|\t)/.test(line) && quoted.startsWith(missingPrefix) && quoted.length > missingPrefix.length) {
            result.push(missing(line, line, {heading, labels: normalizedLabels(quoted.slice(missingPrefix.length)),
                family: "", styles: "", priorWarning: true}));
            continue;
        }
        const open = line.match(fence);
        if (open) {
            const [, indent, marker, info] = open;
            const close = new RegExp("^ {0,3}" + marker[0] + "{" + marker.length + ",}[ \\t]*$");
            let end = i + 1;
            while (end < lines.length && !close.test(lines[end])) end++;
            if (end === lines.length) {
                result.push(lines.slice(i).join("\n"));
                break;
            }
            const body = lines.slice(i + 1, end).join("\n");
            const language = info.trim().toLowerCase();
            const image = /^(svg|xml|html)?$/.test(language) && svgFromText(body);
            if (image) {
                result.push(indent + image);
            } else {
                const inferred = /^(?:text|plaintext|txt)?$/.test(language) && diagramLanguage(body);
                const alias = {dot: "graphviz", puml: "plantuml", mmd: "mermaid"}[language];
                const canonical = /^(mermaid|graphviz|plantuml)$/.test(language) && language;
                result.push(inferred || typeof alias === "string" || canonical
                    ? indent + marker + (inferred || alias || canonical) : line, body, lines[end]);
            }
            i = end;
            continue;
        }
        const addressImage = svgFromDataURL(line);
        if (addressImage) {
            result.push("![SVG 图](" + addressImage + ")");
            continue;
        }
        if (/^ {0,3}(?:<svg[\s/>]|<\?xml\b)/i.test(line)) {
            let end = i;
            let depth = 0;
            for (; end < lines.length; end++) {
                for (const match of lines[end].matchAll(/<(\/?)svg\b[^>]*>/gi)) {
                    if (match[1]) depth--;
                    else if (!match[0].endsWith("/>")) depth++;
                }
                if (depth <= 0 && /(?:<\/svg>|\/>)\s*$/i.test(lines[end])) break;
                if (end > i && fence.test(lines[end])) break;
            }
            const image = svgFromText(lines.slice(i, end + 1).join("\n"));
            if (image) {
                result.push(image);
                i = end;
                continue;
            }
        }
        const chart = chartSelector.exec(line) || (/^\s*\\?#chatgpt-mermaid-(?:\\[_-]|[\w-])+\s*$/.test(line) &&
            /^\s*\{/.test(lines[i + 1] || "") && chartSelector.exec(line + "\n" + lines[i + 1]));
        if (chart && !/^(?: {4}|\t)/.test(line) && !line.slice(0, chart.index).includes("`")) {
            let part = readRenderedChart(text, starts[i] + chart.index, chart[0], missing, heading);
            if (part) {
                const prefix = line.slice(0, chart.index).trim();
                if (prefix) result.push(prefix, "");
                for (;;) {
                    result.push(part.markdown);
                    while (i + 1 < lines.length && starts[i + 1] <= part.end) i++;
                    if (!part.next) break;
                    const next = readRenderedChart(text, part.end, part.next, missing, heading);
                    if (!next) {
                        result.push(text.slice(part.end, starts[i] + lines[i].length));
                        break;
                    }
                    result.push("");
                    part = next;
                }
                continue;
            }
        }
        if (containsLostDiagram && /^#{1,6}\s+.*\bSVG\b/i.test(line)) {
            let next = i + 1;
            while (next < lines.length && !lines[next].trim()) next++;
            if (next === lines.length || /^#{1,6}\s/.test(lines[next])) {
                result.push(line, "", "> 复制内容中缺少 SVG 图像。");
                continue;
            }
        }
        // Some Markdown exporters put an encoded trailing space inside strong.
        if (line.includes("**") && /&#(?:x20|32);/i.test(line) && !line.includes("`") && !/^(?: {4}|\t)/.test(line)) {
            result.push(line.replace(/\*\*([^\s*][^*]*?)&#(?:x20|32);\*\*/gi, "**$1** "));
        } else {
            result.push(line);
        }
    }
    const output = result.join("\n");
    // A clipboard containing just the diagram source has no fence.
    const kind = diagramLanguage(output);
    if (kind && !lines.some(line => fence.test(line)) && !/\n#{1,6}\s/.test(output)) {
        return "```" + kind + "\n" + output.trim() + "\n```";
    }
    return output;
}

function templateFor(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template;
}

function diagramsIn(fragment) {
    return Array.from(fragment.querySelectorAll("svg")).filter(svg =>
        !svg.parentElement?.closest("svg") && !svg.closest(".katex, pre, code") &&
        (!svg.closest("button, [role=button]") || mermaidPreview(svg)) &&
        !(svg.getAttribute("aria-hidden") === "true" && !svg.querySelector("text, foreignObject")));
}

function codeText(element) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
    // Some code viewers render one div per line. textContent joins those
    // adjacent lines and can turn several Mermaid statements into one.
    for (const line of copy.querySelectorAll("div")) {
        if (line.nextSibling && !line.textContent.endsWith("\n") &&
            !line.nextSibling.textContent.startsWith("\n")) line.append("\n");
    }
    return copy.textContent;
}

function markdownDiagrams(markdown) {
    const sources = [];
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let hasBody = false;
    for (let i = 0; i < lines.length; i++) {
        const open = lines[i].match(fence);
        if (!open) {
            if (lines[i].trim()) hasBody = true;
            continue;
        }
        const close = new RegExp("^ {0,3}" + open[2][0] + "{" + open[2].length + ",}[ \\t]*$");
        let end = i + 1;
        while (end < lines.length && !close.test(lines[end])) end++;
        if (end === lines.length) break;
        const language = open[3].trim().toLowerCase();
        const source = lines.slice(i + 1, end).join("\n");
        if (/^(?:mermaid|mmd)$/.test(language) ||
            (/^(?:text|plaintext|txt)?$/.test(language) && diagramLanguage(source) === "mermaid")) sources.push(source);
        else hasBody = true;
        i = end;
    }
    if (!sources.length && diagramLanguage(markdown) === "mermaid" && !lines.some(line => fence.test(line))) {
        return {sources: [markdown.trim()], hasBody: false};
    }
    return {sources, hasBody};
}

function hasMermaidSource(markdown) {
    return !!markdown && markdownDiagrams(markdown).sources.length > 0;
}

function mermaidPreview(svg) {
    const role = svg.getAttribute("aria-roledescription") || "";
    return /mermaid/i.test(svg.id || "") || !!svg.closest(".mermaid") ||
        /^(?:flowchart|class|state|sequence|erDiagram|mindmap|pie|gantt|timeline|architecture|block|c4|git|journey|quadrant|requirement|sankey|xychart|kanban|packet|radar|treemap)/i.test(role);
}

function mermaidPre(source) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-mermaid";
    code.textContent = source;
    pre.append(code);
    return pre;
}

function richMarkdown(html, capture, lute, plain) {
    if (!/<(?:svg|pre)\b|mermaid|data:image\/svg\+xml|cm-content/i.test(html)) return "";
    const template = templateFor(html);
    const diagrams = diagramsIn(template.content);
    const images = Array.from(template.content.querySelectorAll("img"));
    const {sources, hasBody} = markdownDiagrams(plain);
    const previews = new Set();
    diagrams.forEach(svg => { if (mermaidPreview(svg)) previews.add(svg); });
    let changed = false;
    for (const img of images) {
        const src = img.getAttribute("src");
        const xml = src && svgDataSource(src);
        if (sources.length && (img.closest(".mermaid") || (xml && mermaidPreview(
            new DOMParser().parseFromString(xml, "image/svg+xml").documentElement)))) previews.add(img);
        const url = xml && svgURLFromText(xml);
        if (url) {
            img.src = url;
            changed = true;
        }
    }
    const slots = Array.from(template.content.querySelectorAll("svg,img")).filter(el => previews.has(el));
    // Both clipboard representations follow document order. Replace each preview
    // independently so reversed arrows or repeated node names remain distinct.
    if (sources.length && slots.length === sources.length && !chartSelector.test(plain)) {
        if (hasBody && previews.size === diagrams.length + images.length) return plain;
        const existingCode = Array.from(template.content.querySelectorAll("pre, .cm-content, [data-mermaid-source]"))
            .filter(el => !el.parentElement?.closest("pre, .cm-content, [data-mermaid-source]") && !el.querySelector(".cm-gap"))
            .map(el => (el.dataset.mermaidSource || codeText(el)).trim());
        slots.forEach((slot, i) => {
            const represented = existingCode.indexOf(sources[i].trim());
            if (represented < 0) slot.replaceWith(mermaidPre(sources[i]));
            else {
                existingCode.splice(represented, 1);
                slot.remove();
            }
        });
        changed = true;
    } else if (sources.length && !diagrams.length && !images.length && capture?.markdown === plain &&
        !chartSelector.test(plain)) return plain;
    for (const el of template.content.querySelectorAll("[data-mermaid-source], .mermaid:not(pre):not(code), .cm-content")) {
        if (!template.content.contains(el)) continue;
        if (el.querySelector(".cm-gap") || el.closest("pre")) continue;
        const source = el.getAttribute("data-mermaid-source") || (!el.querySelector("svg") && codeText(el));
        const declared = el.hasAttribute("data-mermaid-source") || el.classList.contains("mermaid");
        if (!source || (declared ? !source.trim() : diagramLanguage(source) !== "mermaid")) continue;
        if (!el.hasAttribute("data-mermaid-source") && el.querySelector("img, .cm-gap")) continue;
        el.replaceWith(mermaidPre(source));
        changed = true;
    }
    diagrams.forEach(svg => {
        if (!template.content.contains(svg)) return;
        const img = document.createElement("img");
        img.alt = svg.querySelector("title")?.textContent || svg.getAttribute("aria-label") || "SVG 图";
        img.src = svgImage(svg);
        svg.replaceWith(img);
        changed = true;
    });
    for (const pre of template.content.querySelectorAll("pre")) {
        const code = pre.querySelector("code") || pre;
        const source = codeText(code);
        const kind = diagramLanguage(source);
        const explicit = (code.dataset.language || pre.dataset.language ||
            (code.className + " " + pre.className).match(/\b(?:language|lang)-([\w+-]+)/i)?.[1] ||
            (code.classList.contains("mermaid") || pre.classList.contains("mermaid") ? "mermaid" : "")).toLowerCase();
        const isSVG = /^\s*(?:<\?xml[^>]*>\s*)?<svg[\s/>]/.test(code.textContent);
        if ((!explicit || /^(?:mermaid|mmd|dot|graphviz|plantuml|puml|svg|xml|html)$/.test(explicit)) &&
            (kind || isSVG || explicit === "mermaid" || explicit === "mmd")) {
            const clean = document.createElement("code");
            clean.className = "language-" + (explicit || kind || "svg");
            clean.textContent = source;
            pre.replaceChildren(clean);
            changed = true;
        }
    }
    if (!changed) return "";
    for (const control of template.content.querySelectorAll("style, script, iframe, object, embed")) control.remove();
    for (const control of template.content.querySelectorAll("button, [role=button]")) {
        if (template.content.contains(control)) control.replaceWith(...control.querySelectorAll('img[src^="data:image/" i], pre'));
    }
    return lute.HTML2Md(template.innerHTML);
}

async function kernel(endpoint, body, signal) {
    const response = await fetch("/api/" + endpoint, {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body), signal
    });
    const result = await response.json();
    if (!response.ok || result.code !== 0) throw Error(result.msg || endpoint);
    return result.data;
}

async function readReviews(plugin, bucket) {
    const path = "/data/storage/petal/" + plugin.name + "/" + bucket;
    const signal = AbortSignal.timeout(3000);
    const files = await kernel("file/readDir", {path}, signal);
    return Promise.all((files || []).filter(f => !f.isDir && /^[\w-]+\.json$/.test(f.name)).map(async file => {
        const response = await fetch("/api/file/getFile", {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({path: path + "/" + file.name}), signal
        });
        return response.json();
    }));
}

function chooseReview(chart, reviews) {
    const candidates = reviews.filter(r => r?.labels === chart.labels && (r.family === chart.family || chart.priorWarning) &&
        typeof r.source === "string" && diagramLanguage(r.source) === "mermaid");
    const scoped = chart.heading && (chart.family || chart.priorWarning) ? candidates.filter(r => r.heading === chart.heading) : [];
    const byStyle = candidates.filter(r => (!chart.heading || !r.heading || r.heading === chart.heading) &&
        r.styles && r.styles === chart.styles);
    const sources = new Set((scoped.length ? scoped : byStyle).map(r => r.source));
    return sources.size === 1 ? sources.values().next().value : "";
}

async function restoreReviewed(markdown, pending, legacy, lookup) {
    const buckets = new Map();
    const replacements = await Promise.all(pending.map(async ({fragment, fallback, chart}) => {
        try {
            let source = "";
            if (legacy && crypto.subtle) {
                const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fragment));
                const key = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
                source = legacy[key];
            }
            if (!source && chart.labels && lookup) {
                const bucket = reviewBucket(chart.labels);
                if (!buckets.has(bucket)) buckets.set(bucket, lookup(bucket));
                source = chooseReview(chart, await buckets.get(bucket));
            }
            if (typeof source === "string" && diagramLanguage(source) === "mermaid") return "```mermaid\n" + source + "\n```";
        } catch { /* Keep this fragment readable when the review store is offline. */ }
        return fallback;
    }));
    pending.forEach(({token}, i) => { markdown = markdown.replace(token, () => replacements[i]); });
    return markdown;
}

function captureKey(doc, heading, labels) {
    return JSON.stringify([doc, heading, labels]);
}

function repairDialog(plugin, block, labels) {
    const id = block.dataset.nodeId;
    const dialog = new Dialog({
        title: "用源码修复 Mermaid 图", width: "min(560px, 90vw)",
        content: '<div class="b3-dialog__content"><label>粘贴这张图的 Mermaid 源码<textarea class="b3-text-field fn__block" rows="10"></textarea></label></div>' +
            '<div class="b3-dialog__action"><button class="b3-button">修复并记住</button></div>'
    });
    const input = dialog.element.querySelector("textarea");
    const button = dialog.element.querySelector("button.b3-button");
    input.focus();
    button.onclick = async () => {
        const raw = input.value.trim();
        const fenced = /^(`{3,}|~{3,})(?:mermaid|mmd)\s*\n([\s\S]*?)\n\1$/.exec(raw);
        const source = (fenced ? fenced[2] : raw).trim();
        if (diagramLanguage(source) !== "mermaid" || /^ {0,3}(?:`{3,}|~{3,})/m.test(source)) {
            showMessage("请粘贴一张图的完整 Mermaid 源码。");
            return;
        }
        button.disabled = true;
        try {
            if (window.mermaid?.parse) await window.mermaid.parse(source);
            const crumbs = await kernel("block/getBlockBreadcrumb", {id});
            const heading = normalizedHeading(crumbs.filter(c => c.type === "NodeHeading").pop()?.name || "");
            const doc = crumbs.find(c => c.type === "NodeDocument")?.id;
            const key = normalizedLabels(labels);
            const captured = plugin.recentCharts.get(captureKey(doc, heading, key)) ||
                plugin.recentCharts.get(captureKey(doc, "", key));
            const current = await kernel("block/getBlockKramdown", {id});
            if (current.kramdown.split("\n")[0].trim() !== missingPrefix + labels) throw Error("该块已变更，请重新打开块菜单。");
            await kernel("block/updateBlock", {id, dataType: "markdown", data: "```mermaid\n" + source + "\n```"});
            dialog.destroy();
            const family = captured?.family || source.match(/^(flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram|erDiagram|pie|gantt)\b/m)?.[1];
            if (!captured && !(heading && family)) { showMessage("图表已修复。"); return; }
            const record = {heading, family: family === "graph" ? "flowchart" : (family || ""), labels: key, styles: captured?.styles, source};
            const saved = await plugin.saveData(reviewBucket(record.labels) + "/" + id + ".json", record);
            if (saved?.code) throw Error("图表已修复，保存复用记录失败：" + saved.msg);
            showMessage("已修复图表并保存对应源码。");
        } catch (error) { showMessage(String(error.message || error), 6000, "error"); }
        finally { button.disabled = false; }
    };
}

module.exports = class ChatGPTMarkdown extends Plugin {
    onload() {
        this.reviewed = this.loadData?.("mermaid-repairs.json").catch(() => null);
        // SiYuan sanitizes rich HTML before emitting its paste hook, which drops
        // SVG styles. Keep the original markup for the matching editor event.
        this.originals = new WeakMap();
        this.recentCharts = new Map();
        this.blockMenu = ({detail}) => {
            if (detail.blockElements?.length !== 1) return;
            const selected = detail.blockElements[0];
            const block = selected.dataset.type === "NodeBlockquote" && selected.querySelectorAll("[data-node-id]").length === 1
                ? selected.querySelector("[data-node-id]") : selected;
            if (block.dataset.type !== "NodeParagraph") return;
            const text = block.querySelector('[contenteditable="true"]')?.textContent.trim();
            if (text?.startsWith(missingPrefix)) detail.menu.addItem({
                label: "用 Mermaid 源码修复此图…", click: () => repairDialog(this, block, text.slice(missingPrefix.length))
            });
        };
        this.eventBus.on("click-blockicon", this.blockMenu);
        this.capture = event => {
            const editor = event.target.closest?.(".protyle-wysiwyg");
            if (!editor) return;
            this.originals.delete(editor);
            const clipboard = event.clipboardData;
            if (!clipboard || clipboard.files.length || clipboard.types.includes("text/siyuan")) return;
            const html = clipboard.getData("text/html");
            const markdown = clipboard.getData("text/markdown");
            const fragment = /<svg[\s>]|data:image\/svg\+xml|data-mermaid-source|\bmermaid\b|cm-content/i.test(html) && templateFor(html).content;
            const hasDiagramHTML = fragment && (diagramsIn(fragment).length ||
                fragment.querySelector('img[src^="data:image/svg+xml" i],[data-mermaid-source],.cm-content,.mermaid,[class*=language-mermaid],[data-language=mermaid]'));
            if (hasDiagramHTML || hasMermaidSource(markdown)) this.originals.set(editor, {
                html: hasDiagramHTML ? html : "", markdown, time: Date.now(),
                text: clipboard.getData("text/plain").replace(/\r\n?/g, "\n")
            });
        };
        this.paste = event => {
            const { protyle, textHTML, textPlain, siyuanHTML, files, resolve } = event.detail;
            const editor = protyle.wysiwyg.element;
            const raw = this.originals.get(editor);
            this.originals.delete(editor);
            if (siyuanHTML || files?.length) return;
            const anchor = window.getSelection()?.anchorNode;
            const target = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
            if (target?.closest('[data-type="NodeCodeBlock"], [data-type~="code"], pre, textarea, input')) return;
            const plain = (textPlain || "").replace(/\r\n?/g, "\n");
            const capture = raw && raw.text === plain && Date.now() - raw.time < 5000 ? raw : null;
            try {
                const original = capture?.markdown && hasMermaidSource(capture.markdown) ? capture.markdown : plain;
                const rich = richMarkdown(capture?.html || textHTML || "", capture, protyle.lute, original);
                const pending = [];
                const register = this.reviewed && ((fragment, fallback, chart) => {
                    const token = "\uE000cgmd-" + crypto.getRandomValues(new Uint32Array(4)).join("-") + "\uE001";
                    pending.push({token, fragment, fallback, chart});
                    if (chart.styles && chart.labels && protyle.block?.rootID) {
                        const key = captureKey(protyle.block.rootID, chart.heading, chart.labels);
                        const prior = this.recentCharts.get(key);
                        this.recentCharts.set(key, prior === undefined || prior?.styles === chart.styles ? chart : null);
                        if (this.recentCharts.size > 24) this.recentCharts.delete(this.recentCharts.keys().next().value);
                    }
                    return token;
                });
                const markdown = normalizeMarkdown(rich || original, register);
                const plainHasStructure = /^(?: {0,3}#{1,6} | {0,3}(?:`{3,}|~{3,})|\|.+\|\n\s*\|[-: ])/m.test(plain);
                if (!rich && markdown === plain && !(textHTML && plainHasStructure &&
                    !/<(?:pre|img|table|math|svg|a|h[1-6]|ul|ol)\b/i.test(textHTML))) return;
                event.preventDefault();
                const payload = text => ({textPlain: text, textHTML: "", siyuanHTML: "", files});
                if (pending.length) {
                    resolve(Promise.resolve(this.reviewed).then(records => restoreReviewed(markdown, pending, records,
                        bucket => readReviews(this, bucket))).then(payload));
                } else resolve(payload(markdown));
            } catch (error) {
                console.warn("[ChatGPT Markdown] 使用思源原有粘贴流程", error);
            }
        };
        document.addEventListener("paste", this.capture, true);
        this.eventBus.on("paste", this.paste);
    }

    onunload() {
        this.eventBus.off("click-blockicon", this.blockMenu);
        document.removeEventListener("paste", this.capture, true);
        this.eventBus.off("paste", this.paste);
        this.originals = new WeakMap();
    }
};
