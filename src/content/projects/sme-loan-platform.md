---
title: "SME Loan Origination Platform"
tagline: "A full-stack enterprise system for end-to-end SME loan application processing at CTBC Bank."
summary: "Maintained and extended a production-grade platform managing the full lifecycle of SME loan applications — from customer submission and verification through multi-step approvals, PDF contract generation, and downstream integration."
role: "Software Engineer (Maintainer & Feature Developer)"
timeline: "2024 — Present"
featured: true
techStack:
  - C#
  - ASP.NET
  - Java
  - Vue.js
  - Angular
  - MSSQL
  - Oracle
  - RabbitMQ
  - Kubernetes
  - Azure
order: 1
githubUrl: "https://github.com/jimgod100/sme-loan-origination-platform"
---

## Problem

Enterprise SME lending is operationally complex. Each loan application involves multi-party verification, regulatory compliance checks, dynamic business rules across dozens of product types, and tight SLAs on approval turnaround. The existing platform had accrued years of business logic spread across tightly coupled modules, making new feature development slow and regression-prone.

## Goal

My goal was twofold: stabilize the existing system by improving maintainability and test coverage, and extend it with new product features that could be delivered without destabilizing the core approval workflow engine.

## What I Built

I maintained and extended the core loan origination modules — covering application ingestion, customer identity and credit verification, document generation, multi-step approval routing, and downstream disbursement handoffs. On the backend, I worked across C# (ASP.NET) services and Java microservices, both sharing Oracle and MSSQL databases with strict transactional guarantees.

I introduced a RabbitMQ-based event bus to decouple high-latency operations (e.g., external credit bureau calls, document rendering) from the main approval workflow. This made the system more resilient to third-party latency spikes and allowed retries without blocking approval state transitions.

I built a PDF contract generation module that replaced a manual Word template process, using a templating engine to produce legally compliant documents dynamically based on loan product parameters. On the frontend, I implemented Vue.js and Angular components that surfaced workflow state clearly to loan officers and back-office operations staff.

The entire system runs on Kubernetes in Azure, with CI/CD pipelines handling staged rollouts across environments.

## Challenges

The most significant challenge was understanding and safely modifying business rule logic that had no written documentation — the rules existed only in code and in the mental models of senior engineers. I built an internal mapping of the approval state machine before making any changes, which caught several edge cases before they reached staging.

The second challenge was the RabbitMQ integration: the existing services were not designed with idempotency in mind, so introducing a message queue required adding deduplication logic and designing the consumer handlers to be safe under at-least-once delivery semantics.

## Outcome

- Approval workflow stability improved — fewer manual interventions required by operations staff
- PDF generation time reduced from a multi-hour manual process to seconds per document
- RabbitMQ integration decoupled credit verification calls from the synchronous approval path, improving responsiveness under load
- New loan product types can now be onboarded through configuration changes rather than code changes in the rule engine

## Reflection

This project gave me deep exposure to the complexity of production financial systems — not just technically, but operationally. I learned how to reason about state machines in mission-critical workflows, how to introduce infrastructure changes (like a message broker) into a live system without a rewrite, and how to communicate technical tradeoffs to non-engineering stakeholders. It also clarified what I want next: roles where I can work on problems with greater algorithmic depth and at broader scale.
