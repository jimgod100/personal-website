---
title: "LLM Retrieval Playground"
tagline: "A RAG (Retrieval-Augmented Generation) evaluation harness for comparing chunking strategies and embedding models."
summary: "An experimental toolchain for evaluating RAG pipeline configurations — comparing chunking strategies, embedding models, and vector store retrieval quality — with a structured benchmark runner and result visualizer."
role: "Solo Developer (Research Project)"
timeline: "2025 Q1 — Q2"
featured: true
techStack:
  - Python
  - LangChain
  - OpenAI API
  - ChromaDB
  - FastAPI
  - Sentence Transformers
  - Pandas
  - Matplotlib
order: 3
githubUrl: "https://github.com/jimgod100/llm-retrieval-playground"
---

## Problem

RAG pipelines have many tunable components — chunking strategy, chunk size, embedding model, retrieval top-k, reranking — and the interaction effects between these choices are poorly understood without empirical measurement. Most tutorials present a single pipeline as if it were universal, but production RAG quality is highly sensitive to dataset characteristics.

I wanted to build a systematic evaluation harness that would let me run controlled experiments across these variables and measure retrieval quality objectively.

## Goal

Build a modular Python toolchain that: ingests a document corpus, applies configurable chunking strategies, embeds chunks using swappable embedding models, indexes into ChromaDB, runs retrieval for a benchmark question set, and evaluates results using precision@k and MRR (Mean Reciprocal Rank) metrics.

## What I Built

The system has three main components:

**Pipeline Builder** — A Python module that composes ingestion → chunking → embedding → indexing as a configurable pipeline. Chunking strategies include fixed-size, recursive sentence splitting, and semantic clustering. Embedding backends are pluggable (OpenAI `text-embedding-3-small`, `bge-m3`, `all-MiniLM`).

**Benchmark Runner** — Takes a JSONL file of (question, expected_document_ids) pairs, runs retrieval for each question across multiple pipeline configs in parallel, and outputs a structured results CSV.

**Result Visualizer** — A FastAPI web app that reads the results CSV and renders comparison charts — precision@k curves, latency histograms, and side-by-side answer previews for manual inspection.

## Challenges

The hardest part was designing a fair benchmark. Retrieval quality is meaningless without a ground-truth set that reflects real query patterns. I curated a 200-question benchmark from three document corpora (a technical manual, a financial report, and a research paper dataset), with manually verified relevant chunk IDs for each question.

Embedding quality also varied significantly by domain. `bge-m3` outperformed OpenAI's model on technical documents, while OpenAI's model performed better on conversational queries — a tradeoff not visible without systematic measurement.

## Outcome

- Benchmark suite covering 3 corpora, 200 questions, 5 pipeline configurations
- Key finding: semantic chunking + bge-m3 outperformed fixed-size chunking + OpenAI on technical docs by ~14% precision@5
- FastAPI dashboard lets me inspect failure cases and identify retrieval blind spots
- Reusable pipeline abstraction I can apply to future RAG projects

## Reflection

This project shifted how I think about AI engineering. The interesting problems are not in the LLM itself — they are in the retrieval infrastructure, evaluation methodology, and data quality. It also made me more excited about research-adjacent engineering work: building systems that produce measurable, reproducible results rather than vibes-driven prototypes.
