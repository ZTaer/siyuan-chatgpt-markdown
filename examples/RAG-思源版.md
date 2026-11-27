# RAG 可视化兼容性测试

明白了，你是想测试不同的**可视化技术和渲染格式**，而不是不同风格的 AI 生成图片。

下面统一使用 RAG 作为测试内容，你可以直接复制到思源笔记和语雀中，看看哪种格式能够正常显示。

## **方案一：ChatGPT 原生可视化**

**Documents**

原始文档

**Indexing · 索引构建**

文档加载、分块、向量化

**Retrieval · 知识检索**

根据用户问题查找相关知识

**Generation · 答案生成**

结合知识与用户问题生成答案

**Final Answer · 最终回答**

## **方案二：SVG 矢量架构图**

> 根据本回答的 RAG 内容补绘。

![RAG 索引、检索与生成](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgNzAwIDEyMCI+PHRpdGxlPlJBRyDntKLlvJXjgIHmo4DntKLkuI7nlJ/miJA8L3RpdGxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJ4PSIxMiIgZmlsbD0iI2ZhZjlmNSIvPjxnIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZpbGw9IiMxODNjNDIiPjxyZWN0IHg9IjE4IiB5PSIyMCIgd2lkdGg9IjIwMiIgaGVpZ2h0PSI4MCIgcng9IjEyIiBmaWxsPSIjZDZlYWU1Ii8+PHRleHQgeD0iMTE5LjAiIHk9IjUyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjIwIj5JbmRleGluZyDCtyDntKLlvJU8L3RleHQ+PHRleHQgeD0iMTE5LjAiIHk9Ijc4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij7liIblnZcg4oaSIOWQkemHj+WMljwvdGV4dD48cmVjdCB4PSIyNDgiIHk9IjIwIiB3aWR0aD0iMjAyIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiNlMGVhZjQiLz48dGV4dCB4PSIzNDkuMCIgeT0iNTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPlJldHJpZXZhbCDCtyDmo4DntKI8L3RleHQ+PHRleHQgeD0iMzQ5LjAiIHk9Ijc4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij7pl67popgg4oaSIOebuOWFs+efpeivhjwvdGV4dD48cmVjdCB4PSI0NzgiIHk9IjIwIiB3aWR0aD0iMjAyIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiNmNGU0Y2UiLz48dGV4dCB4PSI1NzkuMCIgeT0iNTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPkdlbmVyYXRpb24gwrcg55Sf5oiQPC90ZXh0Pjx0ZXh0IHg9IjU3OS4wIiB5PSI3OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCI+5LiK5LiL5paHIOKGkiDlm57nrZQ8L3RleHQ+PHRleHQgeD0iMjM0IiB5PSI2NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyMSI+4oaSPC90ZXh0Pjx0ZXh0IHg9IjQ2NCIgeT0iNjciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjEiPuKGkjwvdGV4dD48L2c+PC9zdmc+)

## **方案三：Mermaid 流程图（Flowchart）**

> 根据复制文本中的标签重建，连线和层级按 RAG 流程补全。

```mermaid
flowchart LR
    A[原始文档] --> B[文本分块] --> C[Embedding] --> D[(向量知识库)]
    Q[用户问题] --> E[知识检索]
    D --> E
    E --> F[LLM]
    Q --> F
    F --> G[最终回答]
```

## **方案四：Mermaid 思维导图（Mindmap）**

> 根据复制文本中的标签重建，连线和层级按 RAG 流程补全。

```mermaid
mindmap
  root((RAG))
    Indexing 索引构建
      Document Loader
      Text Splitter
      Embedding
      Vector Store
    Retrieval 知识检索
      User Query
      Similarity Search
      Top-K
      Reranking
    Generation 答案生成
      Prompt
      Context
      LLM
      Final Answer
```

## **方案五：原生 SVG 思维导图**

> 根据本回答的 RAG 内容补绘。

![RAG 三个阶段的知识结构](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MDAiIGhlaWdodD0iMjgwIiB2aWV3Qm94PSIwIDAgNzAwIDI4MCI+PHRpdGxlPlJBRyDkuInkuKrpmLbmrrXnmoTnn6Xor4bnu5PmnoQ8L3RpdGxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJ4PSIxMiIgZmlsbD0iI2ZhZjlmNSIvPjxnIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZpbGw9IiMxODNjNDIiPjxwYXRoIGQ9Ik0xNDIgMTQwIEgxODQgVjUwIEgyMjAgTTE4NCAxNDAgSDIyMCBNMTg0IDE0MCBWMjMwIEgyMjAiIHN0cm9rZT0iIzdjOTE5MCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHJlY3QgeD0iMzAiIHk9IjExMiIgd2lkdGg9IjExMiIgaGVpZ2h0PSI1NiIgcng9IjEyIiBmaWxsPSIjMjQ0OTUwIi8+PHRleHQgeD0iODYiIHk9IjE0NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiPlJBRzwvdGV4dD48cmVjdCB4PSIyMjAiIHk9IjEyIiB3aWR0aD0iNDU1IiBoZWlnaHQ9Ijc2IiByeD0iMTIiIGZpbGw9IiNkNmVhZTUiLz48dGV4dCB4PSI0NDcuNSIgeT0iNDQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPkluZGV4aW5nIMK3IOe0ouW8lTwvdGV4dD48dGV4dCB4PSI0NDcuNSIgeT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiPkRvY3VtZW50IExvYWRlciDCtyBUZXh0IFNwbGl0dGVyIMK3IEVtYmVkZGluZyDCtyBWZWN0b3IgU3RvcmU8L3RleHQ+PHJlY3QgeD0iMjIwIiB5PSIxMDIiIHdpZHRoPSI0NTUiIGhlaWdodD0iNzYiIHJ4PSIxMiIgZmlsbD0iI2UwZWFmNCIvPjx0ZXh0IHg9IjQ0Ny41IiB5PSIxMzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPlJldHJpZXZhbCDCtyDmo4DntKI8L3RleHQ+PHRleHQgeD0iNDQ3LjUiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCI+VXNlciBRdWVyeSDCtyBTaW1pbGFyaXR5IFNlYXJjaCDCtyBUb3AtSyDCtyBSZXJhbmtpbmc8L3RleHQ+PHJlY3QgeD0iMjIwIiB5PSIxOTIiIHdpZHRoPSI0NTUiIGhlaWdodD0iNzYiIHJ4PSIxMiIgZmlsbD0iI2Y0ZTRjZSIvPjx0ZXh0IHg9IjQ0Ny41IiB5PSIyMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPkdlbmVyYXRpb24gwrcg55Sf5oiQPC90ZXh0Pjx0ZXh0IHg9IjQ0Ny41IiB5PSIyNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiPlByb21wdCDCtyBDb250ZXh0IMK3IExMTSDCtyBGaW5hbCBBbnN3ZXI8L3RleHQ+PC9nPjwvc3ZnPg==)

## **方案六：Mermaid 时序图（Sequence Diagram）**

> 根据复制文本中的标签重建，连线和层级按 RAG 流程补全。

```mermaid
sequenceDiagram
    participant U as 用户
    participant R as Retriever
    participant V as 向量数据库
    participant M as LLM
    U->>R: 提出问题
    R->>V: 查询相关知识
    V-->>R: 返回 Top-K 文档
    R->>M: 用户问题 + 相关知识
    M-->>U: 最终回答
```

## **方案七：Graphviz 架构图**

```graphviz
digraph RAG {
    rankdir=LR

    node [
        shape=box,
        style="rounded,filled",
        fillcolor="#F1F5F9",
        color="#CBD5E1"
    ]

    A [label="Indexing\n索引构建", fillcolor="#DBEAFE"]
    B [label="Retrieval\n知识检索", fillcolor="#CCFBF1"]
    C [label="Generation\n答案生成", fillcolor="#EDE9FE"]

    A -> B -> C
}
```

这是一段 Graphviz 源码，在支持 Graphviz 的编辑器中才能渲染为图形。

## **方案八：PlantUML 架构图**

```plantuml
@startuml
skinparam backgroundColor transparent
skinparam roundcorner 15
skinparam shadowing false

rectangle "Indexing\n索引构建" as A #DBEAFE
rectangle "Retrieval\n知识检索" as B #CCFBF1
rectangle "Generation\n答案生成" as C #EDE9FE

A -right-> B
B -right-> C
@enduml
```

## **方案九：Unicode 字符思维导图**

```
RAG（检索增强生成）
│
├── 01. Indexing（索引构建）
│   ├── Document Loader
│   ├── Text Splitter
│   ├── Embedding
│   └── Vector Store
│
├── 02. Retrieval（知识检索）
│   ├── User Query
│   ├── Similarity Search
│   ├── Hybrid Search
│   └── Reranking
│
└── 03. Generation（答案生成）
    ├── Context Engineering
    ├── LLM
    ├── Answer Validation
    └── Final Answer
```

## **方案十：Unicode 字符流程图**

```
        ┌─────────────────┐
        │    Documents    │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │    Indexing     │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │  Vector Store   │
        └────────┬────────┘
                 │
User Query ─────→│
                 ↓
        ┌─────────────────┐
        │    Retrieval    │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │     Context     │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │       LLM       │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │  Final Answer   │
        └─────────────────┘
```

## **方案十一：Markdown 表格可视化**

| ① Indexing | ② Retrieval | ③ Generation |
| ---------- | ----------- | ------------ |
| 原始文档       | 用户问题        | 系统提示词        |
| ↓          | ↓           | ↓            |
| 文本分块       | 向量化         | 上下文组织        |
| ↓          | ↓           | ↓            |
| Embedding  | 相似度检索       | LLM          |
| ↓          | ↓           | ↓            |
| 向量知识库      | 相关知识        | 最终回答         |

## **方案十二：交互式动态可视化**

> 以下为复制时保留下来的静态内容。

## **RAG 工作流程演示**

Indexing · Retrieval · Generation

**用户问题：什么是 RAG？**

Similarity Search

RAG 技术原理

0.98

向量检索机制

0.86

LangChain 开发指南

0.72

模拟检索相关性分数点击顶部三个阶段，切换不同的数据处理流程。

## **兼容性测试记录**

你可以在两个笔记软件中分别测试，并在下面记录结果。

| 可视化方案             | 思源 | 语雀 |
| ----------------- | -- | -- |
| 1. ChatGPT 原生可视化  |    |    |
| 2. SVG 架构图        |    |    |
| 3. Mermaid 流程图    |    |    |
| 4. Mermaid 思维导图   |    |    |
| 5. SVG 思维导图       |    |    |
| 6. Mermaid 时序图    |    |    |
| 7. Graphviz       |    |    |
| 8. PlantUML       |    |    |
| 9. Unicode 思维导图   |    |    |
| 10. Unicode 流程图   |    |    |
| 11. Markdown 表格   |    |    |
| 12. 交互式可视化        |    |    |
| 13. PNG 图片（上一条回复） |    |    |

能够正常复制并显示的方案打勾，未勾选表示尚未确认支持。提交兼容性测试结果

以上共提供了 12 种不同的可视化示例，加上之前生成的 PNG 图片，共 13 项测试内容。Graphviz、PlantUML 等源码需要相应的渲染引擎，目前还没有在你的笔记软件环境中实际验证。

你可以先测试整篇复制，再测试单独复制图表，最终选择**兼顾美观、易读和笔记兼容性**的方案。