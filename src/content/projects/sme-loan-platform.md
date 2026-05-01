---
title: "SME Loan Origination Platform"
tagline: "Full-stack digital lending workflow covering case creation, KYC/AML, credit scoring, and disbursement."
summary: "Built and maintained a full-stack SME loan origination platform at CTBC Bank, handling multi-state business workflows across backend services (C#, Java), async messaging (RabbitMQ), relational databases (MSSQL, Oracle), and frontend interfaces (Vue.js, Angular) in a Kubernetes/Azure environment."
role: "Software Engineer — CTBC Bank"
timeline: "2024 — Present"
featured: true
techStack:
  - C#
  - ASP.NET
  - Java
  - Spring Boot
  - RabbitMQ
  - MSSQL
  - Oracle
  - Vue.js
  - Angular
  - Kubernetes
  - Azure
order: 1
---

## Problem

SME (small and medium enterprise) lending at a large financial institution involves dozens of interdependent steps — document collection, identity verification, AML screening, credit bureau lookups, internal approval routing, and final disbursement — all subject to regulatory audit requirements. These processes were spread across legacy systems with inconsistent data flows and limited observability, making it difficult to track case state, diagnose failures, or onboard new business rules quickly.

## Goal

Build and maintain a unified loan origination platform that: centralizes the full lending lifecycle into a single auditable workflow system; integrates with external KYC/AML providers, credit scoring engines, and core banking systems; supports configurable approval routing; and provides reliable document generation for regulatory and customer-facing outputs.

## What I Built

**Backend services** — Core workflow logic in C# (ASP.NET) and Java (Spring Boot), exposing REST APIs consumed by frontend interfaces and downstream integrators. Each major workflow phase (intake, KYC, credit assessment, approval, disbursement) is modeled as a discrete service with clear state transitions and rollback handling.

**Async event processing** — High-volume steps (AML batch checks, credit bureau callbacks, notification dispatch) are decoupled from the synchronous request path using RabbitMQ. This prevents timeout failures in upstream systems from blocking case progression and enables retry logic for transient failures.

**Database layer** — Complex query optimization across MSSQL and Oracle for case search, audit log retrieval, and regulatory reporting. Introduced indexed views and query plan tuning to reduce P95 latency on report queries that aggregate across large case histories.

**PDF document generation** — Dynamic generation of loan agreements, KYC summary reports, and approval notices by binding structured template definitions to real-time case data pulled from multiple upstream sources. Output must meet regulatory formatting requirements and be reproducible given the same case snapshot.

**Frontend interfaces** — Workflow UIs in Vue.js and Angular for operations staff: case dashboards, document review queues, approval routing panels, and audit trail views. Worked closely with ops teams to translate compliance-driven business rules into practical interface flows.

**Deployment & operations** — Containerized services running on Kubernetes (Azure). Participated in CI/CD pipeline maintenance, production deployments, and on-call incident response for workflow failures.

## Challenges

**State consistency across distributed steps.** When an external KYC check times out mid-workflow, the platform must resume correctly after retry without duplicating records or skipping audit events. Designing idempotent handlers and explicit state machine transitions (rather than implicit conditional logic) was key to making this reliable.

**Regulatory auditability.** Every data mutation — who changed what, when, and why — must be queryable for compliance review. Implementing append-only audit logs with tamper-evident structure, without degrading write throughput on high-volume case tables, required careful schema design.

**Legacy system integration.** Several upstream systems expose inconsistent or poorly documented APIs. Building thin adapter layers with explicit error mapping and circuit-breaker patterns kept the core workflow logic clean while absorbing upstream instability.

## Outcome

- Unified a fragmented lending workflow into a single auditable platform, reducing case processing errors and improving ops-team visibility into case state.
- Async decoupling via RabbitMQ eliminated a class of timeout-related case failures that had previously required manual intervention.
- PDF generation pipeline handles all required regulatory document types with consistent formatting, reducing compliance review cycles.

## Reflection

This project gave me deep exposure to the complexity of building workflow-driven systems under real regulatory constraints — where correctness, auditability, and failure recovery matter more than raw throughput. It also reinforced the value of explicit state modeling and clean integration boundaries when coordinating across many external dependencies. The distributed systems and reliability patterns I applied here directly motivate my interest in graduate-level CS study focused on systems and AI infrastructure.
