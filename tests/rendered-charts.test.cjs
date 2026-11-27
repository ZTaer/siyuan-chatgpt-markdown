const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the plugin's public plain-text paste hook without opening a notebook.
function paste(textPlain, {markdown = "", records, reviews = []} = {}) {
    const context = {
        module: {}, require: () => ({Plugin: class {}}),
        document: {addEventListener() {}}, window: {getSelection: () => null},
        Node: {ELEMENT_NODE: 1}, console, crypto: require("node:crypto").webcrypto, TextEncoder, AbortSignal,
        fetch: async (url, {body}) => {
            const list = reviews.map((_, index) => ({name: index + ".json"}));
            const value = url.endsWith("readDir") ? {code: 0, data: list} :
                reviews[parseInt(path.basename(JSON.parse(body).path), 10)];
            return {ok: true, json: async () => value};
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../index.js"), "utf8"), context);
    const plugin = new context.module.exports();
    plugin.eventBus = {on() {}};
    if (records) plugin.loadData = async () => records;
    plugin.onload();
    const editor = {};
    if (markdown) plugin.capture({
        target: {closest: () => editor}, clipboardData: {
            files: [], types: ["text/plain", "text/markdown"],
            getData: type => ({"text/plain": textPlain, "text/markdown": markdown}[type] || "")
        }
    });
    let result = textPlain;
    plugin.paste({preventDefault() {}, detail: {
        textPlain, textHTML: "", protyle: {wysiwyg: {element: editor}},
        resolve: payload => { result = payload.then ? payload.then(item => item.textPlain) : payload.textPlain; }
    }});
    return result;
}

const flow = "原始文档文本分块Embedding向量知识库用户问题知识检索LLM最终回答";
const branches = ["RAG", "Indexing 索引构建Document LoaderText SplitterEmbeddingVector Store",
    "Retrieval 知识检索User QuerySimilarity SearchTop-KReranking", "Generation 答案生成PromptContextLLMFinal Answer"];
const chart = (id, kind, labels) => "#" + id + "{}#" + id + " ." + kind + "{fill:red;}" + labels;

test("changes of id, last selector and line breaks preserve both diagram boundaries", () => {
    const css = '\\#chatgpt-mermaid-\\_fresh\\_\n{\nfont-family:"x}";\n\n/* } */\ncolor:red;\n}' +
        '@media screen{rect{fill:red;}}#chatgpt-mermaid-\\_fresh\\_ .flowchart-link{color:red;}';
    const second = chart("chatgpt-mermaid-other", "mindmap-node", branches.join("\n"));
    const out = paste("## Flow\n\n" + css + flow + second + "\n\n## Next\n\nBody {example}.");
    assert.equal((out.match(/```mermaid/g) || []).length, 2);
    assert.match(out, /flowchart LR/);
    assert.match(out, /flowchart TB/);
    assert.ok(out.endsWith("## Next\n\nBody {example}."));
    assert.ok(!out.includes("font-family"));
});

test("workspace reviews handle regenerated IDs, theme changes and old warnings under the same heading", async () => {
    const record = {labels: "WarehouseDock", family: "flowchart", heading: "Shipping",
        styles: "#diagram{}#diagram .flowchart-link{fill:red;}", source: "flowchart LR\nW[Warehouse] --> D[Dock]"};
    const options = {records: {}, reviews: [record]};
    const raw = chart("chatgpt-mermaid-_new_", "flowchart-link", "Warehouse Dock");
    const themed = raw.replace("red", "blue");
    const warning = "> 复制内容中缺少 Mermaid 源码。图中保留的文字：Warehouse Dock";
    assert.ok((await paste(raw, options)).includes(record.source));
    assert.ok((await paste("### **Shipping**\n\n" + themed, options)).includes(record.source));
    assert.ok((await paste("### Shipping\n\n" + warning, options)).includes(record.source));
    assert.ok(!(await paste("### Another section\n\n" + themed, options)).includes(record.source));
    assert.ok(!(await paste("### Shipping\n\n" + themed.replace("Dock", "Airport"), options)).includes(record.source));
    assert.ok(!(await paste("### Shipping\n\n" + themed.replace("flowchart-link", "mindmap-node"), options)).includes(record.source));
    options.reviews.push({...record, source: "flowchart LR\nD[Dock] --> W[Warehouse]"});
    assert.ok((await paste("### Shipping\n\n" + raw, options)).includes("缺少 Mermaid 源码"));
    const actual = "```mermaid\nflowchart LR\nD[Dock] --> W[Warehouse]\n```";
    assert.equal(await paste(raw, {...options, markdown: actual}), actual);
});

test("prefers structured Markdown from the clipboard for unrelated diagram types", () => {
    const source = "## 交通\n\n```mermaid\nsequenceDiagram\nAlice->>Bike: Unlock\n```\n\n" +
        "```mermaid\nclassDiagram\nVehicle <|-- Bike\n```";
    assert.equal(paste("交通\nAliceBikeUnlockVehicleBike", {markdown: source}), source);
    assert.match(paste("architecture-beta\nservice web(server)[Web]"), /^```mermaid/);
});

test("extracts real diagram fences in order and leaves nested Markdown examples literal", () => {
    const nested = "~~~~markdown\n```mermaid\nflowchart LR\nX --> Y\n```\n~~~~";
    const outgoing = "flowchart LR\nW[仓库] --> D[港口]";
    const incoming = "flowchart LR\nW[仓库]\nD[港口]\nD --> W";
    const whole = [nested, "```MERMAID\n" + outgoing + "\n```", "~~~mmd\n" + incoming + "\n~~~"].join("\n\n");
    const context = {require: () => ({Plugin: class {}}), module: {}};
    const diagrams = vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../index.js"), "utf8") + "\nmarkdownDiagrams", context);
    assert.deepEqual(Array.from(diagrams(whole).sources), [outgoing, incoming]);
    assert.equal(diagrams(nested).sources.length, 0);
    assert.ok(paste(whole).startsWith(nested));
});

test("flat exports reuse a reviewed source only for its exact fragment", async () => {
    const raw = chart("chatgpt-mermaid-bike", "flowchart-link", "AliceBike");
    const hash = require("node:crypto").createHash("sha256").update(raw).digest("hex");
    const records = {[hash]: "flowchart LR\nBike --> Alice"};
    const out = await paste("## 交通\n\n" + raw + "\n\n结尾", {records});
    assert.equal(out, "## 交通\n\n```mermaid\n" + records[hash] + "\n```\n\n结尾");
    assert.ok((await paste(raw.replace("red", "blue"), {records})).includes("缺少 Mermaid 源码"));
});

test("preserves unknown labels including braces, following prose and literal code samples", () => {
    const raw = chart("chatgpt-mermaid-new", "actor", "Server {A} → Client");
    const example = "```css\n" + raw + "\n```";
    const out = paste(raw + "\nFollowing {B}\n\n" + example);
    assert.ok(out.includes("图中保留的文字：Server {A} → Client\nFollowing {B}"));
    assert.ok(out.endsWith(example));
    assert.ok(!out.includes("```mermaid"));
    assert.equal(paste("#chatgpt-mermaid-incomplete{color: red"), "#chatgpt-mermaid-incomplete{color: red");
});
