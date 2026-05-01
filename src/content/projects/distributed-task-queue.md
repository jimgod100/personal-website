---
title: "Distributed Task Queue — Go + Redis"
tagline: "A lightweight distributed task queue with priority scheduling, retry logic, and a real-time dashboard."
summary: "Built a distributed background job system from scratch in Go, backed by Redis Streams, with worker concurrency controls, exponential backoff retry, dead-letter queues, and a minimal web dashboard for job monitoring."
role: "Solo Developer (Side Project)"
timeline: "2024 Q3 — Q4"
featured: true
techStack:
  - Go
  - Redis
  - Redis Streams
  - Docker
  - Docker Compose
  - Prometheus
  - Grafana
order: 2
githubUrl: "https://github.com/jimgod100/distributed-task-queue"
---

## Problem

Most background job libraries are either too heavyweight (requiring a full broker like RabbitMQ or Kafka) or too simple (in-memory queues with no durability). I wanted to understand what it takes to build a reliable, persistent, multi-worker task queue from primitives — and use the project to deepen my understanding of distributed systems concepts like at-least-once delivery, consumer groups, and backpressure.

## Goal

Build a production-usable distributed task queue using Redis Streams as the persistence and coordination layer. The system should support: named queues, priority levels, configurable worker pools, retry with exponential backoff, dead-letter queues (DLQ), and basic observability.

## What I Built

The core is a Go library exposing a simple API: `queue.Enqueue(task)` and `queue.RegisterHandler(name, fn)`. Under the hood, tasks are serialized to JSON and written to Redis Streams using `XADD`. Workers use consumer groups (`XREADGROUP`) to claim tasks with at-least-once delivery semantics.

Each worker goroutine processes one task at a time, with configurable concurrency per queue. Failed tasks are requeued with exponential backoff up to a max retry count, after which they are moved to a DLQ stream for inspection. I exposed Prometheus metrics for queue depth, processing latency, and error rates, and wired up a Grafana dashboard for visualization.

The entire stack runs in Docker Compose for local development — Redis, the Go worker process, Prometheus, and Grafana as separate containers.

## Challenges

The most subtle challenge was handling the `PEL` (Pending Entry List) in Redis Streams correctly. When a worker crashes mid-processing, its in-flight messages stay in the PEL indefinitely. I implemented a background "reclaim" loop using `XAUTOCLAIM` to recover stale messages from dead workers, which required careful reasoning about idempotency at the handler level.

Another challenge was implementing priority queues on top of Redis Streams, which don't natively support priority. I solved this by using multiple streams per priority tier and polling them in weighted round-robin order.

## Outcome

- Handles ~8,000 tasks/sec on a single Redis instance under synthetic benchmarks
- Worker crash recovery via XAUTOCLAIM tested and validated
- Dead-letter queue + retry logic working end-to-end
- Grafana dashboard showing real-time queue health

## Reflection

Building this from scratch gave me a much deeper understanding of distributed systems primitives than using an off-the-shelf library ever would. I now have a strong mental model of consumer groups, delivery guarantees, and the operational tradeoffs between Redis Streams, Kafka, and RabbitMQ. This project also made me want to explore more systems programming topics — concurrency primitives, scheduler design, and eventually kernel-level I/O.
