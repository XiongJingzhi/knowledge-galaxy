# Knowledge Galaxy 1.0 Requirements

## 1. Product Vision

### 1.1 Personal Knowledge Disk For The AI Era

Knowledge Galaxy aims to become a personal knowledge disk for the AI era.

It stores a person's long-term accumulated knowledge, including:

- ideas
- decisions
- project experience
- research material
- reviews
- daily records
- curated external knowledge

The problem it solves is not how to generate knowledge, but how to preserve knowledge over time.

### 1.2 Long-Term Goal

The long-term goal of Knowledge Galaxy is to become the long-term memory layer for personal AI systems.

Future AI systems may include:

- RAG systems
- agent systems
- automated research systems
- personal decision systems

These systems should be able to read from Knowledge Galaxy as a stable knowledge source.

### 1.3 Product Positioning

Knowledge Galaxy is not:

- a note-taking application
- a RAG tool
- an AI chat system
- a vector database
- a knowledge graph platform

Knowledge Galaxy is a personal knowledge storage layer.

## 2. System Boundary

### 2.1 In Scope

Knowledge Galaxy is responsible for:

1. Knowledge storage  
   Persist all knowledge as durable documents.
2. Knowledge structure  
   Represent relationships using directories and metadata.
3. Knowledge indexing  
   Provide structured indexes that can be queried.
4. CLI operations  
   Manage the knowledge base through a command-line interface.
5. AI-consumable output  
   Make stored knowledge easy for external systems to read.

### 2.2 Out Of Scope

Knowledge Galaxy does not handle:

- vectorization
- embeddings
- chunking
- RAG retrieval
- AI reasoning
- agent workflows
- semantic search

These capabilities belong to the AI application layer.

## 3. System Architecture

Knowledge Galaxy uses a three-layer architecture:

Knowledge Storage Layer  
down to  
Knowledge Index Layer  
down to  
AI Application Layer

### 3.1 Knowledge Storage Layer

The storage layer is the core of the system.

It is responsible for:

- document storage
- asset management
- directory structure
- metadata expression

Implementation basis:

- Git repository
- Markdown documents
- YAML frontmatter

### 3.2 Knowledge Index Layer

The index layer is a derived query layer generated from the storage layer.

It provides:

- SQL queries
- tag retrieval
- document filtering
- full-text search
- statistics

Implementation basis:

- local SQLite database

The index layer is derived data, not the source of truth.

### 3.3 AI Application Layer

The AI application layer is implemented by external systems, such as:

- Milvus
- RAGFlow
- LangChain
- LlamaIndex
- agent systems

These systems consume data produced by Knowledge Galaxy.

## 4. Core Design Principles

### 4.1 Git Is The Source Of Truth

All knowledge is stored in a Git repository.

Benefits:

- traceable versions
- comparable history
- auditable changes
- portable data

### 4.2 File First

The basic unit of knowledge is a document, not:

- a block
- a chunk
- a database row

### 4.3 CLI First

The CLI is the primary interface.

The CLI should support:

- document creation
- content writing
- asset import
- data querying
- structure validation
- index export

GUI is only a visualization layer over CLI capabilities.

### 4.4 Stable Structure

The system uses a small set of long-lived concepts:

- Theme
- Project
- Daily
- Note

These concepts should remain stable over time.

### 4.5 Human Readable

The knowledge system must remain:

- readable
- maintainable
- understandable

Overly complex data structures should be avoided.

### 4.6 AI Friendly

The structure must provide:

- clear boundaries
- explicit metadata
- stable semantics
- unified paths

This allows AI systems to parse knowledge reliably.

## 5. Core Concepts

### 5.1 Note

Note is the most basic object in the system.

It represents a knowledge document that can independently express meaning, for example:

- ideas
- explanations
- decisions
- research records
- summaries

### 5.2 Daily

Daily is the time-based entry point.

It records daily:

- events
- inputs
- ideas
- decisions
- actions

Daily gives knowledge a time dimension.

### 5.3 Theme

Theme represents a long-lived knowledge domain, such as:

- investing
- health
- ai-factory
- knowledge-galaxy

The number of themes should remain relatively small.

### 5.4 Project

Project represents an action space, such as:

- knowledge-galaxy
- compound
- research-x

Project connects knowledge to execution.

## 6. Knowledge Document Structure

All knowledge documents use a unified format:

Markdown plus YAML frontmatter

### 6.1 Frontmatter Fields

Primary fields include:

- `id`
- `type`
- `title`
- `slug`
- `created_at`
- `updated_at`
- `date`
- `theme`
- `project`
- `tags`
- `source`
- `status`
- `summary`

### 6.2 Supported Document Types

Knowledge Galaxy 1.0 supports:

- `daily`
- `note`
- `thought`
- `decision`
- `review`
- `reference`
- `theme`
- `project`

### 6.3 Document Status

Supported statuses:

- `inbox`
- `active`
- `evergreen`
- `archived`

## 7. Directory Structure

The repository uses a unified structure:

```text
knowledge-galaxy/
  docs/
  dailies/
  notes/
  decisions/
  reviews/
  references/
  themes/
  projects/
  assets/
  inbox/
  indexes/
  scripts/
```

### 7.1 docs

The formal knowledge space. AI systems mainly consume content from this space and the repository structure it defines.

### 7.2 dailies

Daily records organized by time:

`dailies/YYYY/MM/DD.md`

### 7.3 notes

General knowledge documents.

### 7.4 decisions

Important decisions.

### 7.5 reviews

Retrospectives and summaries.

### 7.6 references

Curated external materials.

### 7.7 themes

Theme anchor documents.

### 7.8 projects

Project workspaces. Each project is an independent directory.

## 8. Asset Management

All shared assets are stored in:

`assets/`

Assets may include:

- images
- PDFs
- data files
- webpage snapshots

Benefits of a unified asset directory:

- batch management
- script processing
- unused reference scanning

### 8.1 Project Asset Exception

Projects may use:

`docs/projects/<project>/assets`

for project-specific assets.

## 9. Indexing And Query

Knowledge Galaxy provides query capability through a derived layer synchronized from the Git repository.

### 9.1 Query Layer

The query layer is implemented with local SQLite.

### 9.2 Structured Query

Documents should be filterable by:

- `theme`
- `project`
- `tag`
- `type`
- `status`
- `date`

### 9.3 Tag System

Tags supplement document semantics.

Tag rules:

- lowercase
- kebab-case
- no spaces

Examples:

- `rag`
- `milvus`
- `weekly-review`
- `asset-management`

### 9.4 Full-Text Search

Full-text search should be supported against document body content.

### 9.5 Statistics

The system should support statistics such as:

- document count
- theme distribution
- tag frequency

## 10. CLI Design

The CLI tool name is:

`kg`

### 10.1 CLI Principles

The CLI must be:

- short
- parseable
- automation-friendly
- scriptable

### 10.2 Command Categories

Create:

- create `daily`
- create `note`
- create `decision`
- create `review`

Capture:

- append to daily
- create note from `stdin`
- import from clipboard

Asset management:

- auto copy
- auto rename
- auto generate references

Query:

- `list`
- `search`
- `stats`

Validation:

- frontmatter
- path
- id
- reference checks

Export:

- document list
- change list
- manifest

## 11. Knowledge Lifecycle

The knowledge lifecycle is:

capture  
down to  
inbox  
down to  
organize  
down to  
active  
down to  
evergreen  
down to  
archived

## 12. Relationship With Milvus

Milvus is a vector database.

Knowledge Galaxy does not directly use Milvus.

However, the document structure should be easy to transform into:

- vector records
- metadata

## 13. Relationship With RAGFlow

RAGFlow is responsible for:

- document parsing
- chunking
- embeddings
- retrieval

Knowledge Galaxy only serves as RAGFlow's knowledge source.

## 14. 1.0 Goals

Knowledge Galaxy 1.0 has four goals:

1. Build a stable knowledge repository based on Git and Markdown.
2. Build a clear knowledge structure around Theme, Project, Daily, and Note.
3. Provide query capability through SQL, tags, and search.
4. Support CLI-first operation for core workflows.

## 15. Success Criteria

Knowledge Galaxy 1.0 is successful when any RAG system only needs to:

1. read the repository
2. parse Markdown
3. chunk content
4. build indexes

to construct a usable knowledge base.

## 16. Summary

Knowledge Galaxy is a personal knowledge disk for the AI era.

It preserves knowledge rather than processing knowledge.
