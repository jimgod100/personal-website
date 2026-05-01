---
title: "SME Loan Origination Platform"
slug: "sme-loan-platform"
date: "2024-07"
tags: ["C#", ".NET", "Java", "Spring Boot", "MSSQL", "Oracle", "RabbitMQ", "Vue.js", "Angular", "Kubernetes", "Azure"]
role: "Software Engineer"
company: "CTBC Bank"
status: "Production"
summary: "An internal full-stack platform managing end-to-end SME loan workflows — from case creation and KYC/AML checks to credit scoring, multi-stage approval routing, and disbursement."
---

## Problem

SME lending involves a high volume of cases moving through long, multi-stakeholder approval chains. Each case requires identity verification, AML screening, credit evaluation, document generation, and handoffs between operations, risk, and compliance teams. Managing this with fragmented internal tools created errors, delays, and a lack of visibility into where cases were stalled.

The goal was a unified platform that could handle the full workflow reliably — from the moment a loan application enters the system to the moment funds are disbursed — while being maintainable by a small engineering team.

## What I Built

**Backend services (C# / .NET and Java / Spring Boot)**
Core business logic lives in .NET services; integration-heavy components and batch processing tasks run on Spring Boot. Both connect to MSSQL and Oracle depending on the subsystem.

**Async workflow processing with RabbitMQ**
Long-running steps — credit score lookups, AML screening, document generation — are decoupled from the HTTP request cycle using RabbitMQ message queues. This prevents timeout failures and allows retries without user-facing errors.

**Multi-state case routing**
Loan cases move through a defined state machine: Draft → Submitted → KYC Review → Credit Review → Approval → Disbursement → Closed. Each transition triggers downstream actions (notifications, document requests, queue messages) and enforces business rules.

**KYC / AML verification integration**
The platform calls internal and third-party identity verification services, stores results, and flags cases that require manual review.

**Automated PDF generation**
Loan contracts, approval summaries, and regulatory documents are generated server-side from templates and attached to the case record. This replaced a manual export process that was a bottleneck for ops teams.

**Frontend interfaces (Vue.js and Angular)**
Internal-facing UIs for loan officers, risk reviewers, and compliance staff. Vue.js for the primary case management console; Angular for a legacy admin panel integrated into the workflow.

**Deployment on Kubernetes / Azure**
Services are containerized and deployed to a Kubernetes cluster on Azure. I contributed to deployment configuration, health check setup, and environment-specific configuration management.

## Challenges

**State machine complexity at scale**
With many concurrent cases and multiple actors able to act on a case at the same time, race conditions in state transitions were a real risk. Solving this required careful database-level locking, idempotent message handlers, and thorough testing of edge cases in the approval flow.

**Cross-system data consistency**
The platform integrates with several internal systems that were not designed to work together. Keeping data consistent — especially when an upstream system returns a partial result or fails silently — required explicit error handling, retry logic, and reconciliation jobs.

**Async failure visibility**
When a message in RabbitMQ fails processing, it needs to end up in a dead-letter queue with enough context to debug and replay. Building reliable dead-letter handling and surfacing failures to operations teams without burying them in noise was an ongoing design challenge.

## Outcome

The platform is in production, handling live loan case volume across multiple product types. Key improvements over the previous fragmented tooling:

- Reduced manual handoff steps for operations teams through automated state transitions and notifications
- Eliminated document generation backlogs by automating PDF creation at each case milestone
- Improved case visibility for reviewers through a unified case timeline

## Reflection

This project shaped how I think about backend systems design — specifically the difference between systems that work and systems that fail gracefully. The most valuable engineering work here wasn't the features themselves but the infrastructure around reliability: idempotent handlers, dead-letter queues, explicit state transition rules, and integration error boundaries.

I want to go deeper on distributed systems design at graduate level — formally understanding the tradeoffs I was navigating by instinct here.
