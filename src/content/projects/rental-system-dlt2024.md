---
title: "Smart Rental Platform with LINE Bot AI"
tagline: "ASP.NET MVC rental system integrated with LINE Bot and AI features — DLT2024 Excellent Paper Award."
summary: "Full-stack rental platform connecting landlords and tenants via web and LINE Bot, with AI-assisted responses. Awarded Excellent Paper at DLT2024 Symposium."
timeline: "2024 Q1 — Q2"
role: "Lead Developer (Capstone Project)"
stack: ["C#", "ASP.NET MVC", "LINE Bot SDK", "Azure", "SQL Server", "Bootstrap"]
techStack: ["C#", "ASP.NET MVC", "LINE Bot SDK", "Azure", "SQL Server", "Bootstrap"]
github: "https://github.com/jimgod100"
featured: true
order: 2
---

## Overview

This project was developed as a university capstone and presented at the DLT2024 Symposium, where it received the **Excellent Paper Award**. The goal was to digitize and streamline the rental process — connecting landlords, tenants, and property managers through a unified web platform enhanced with conversational AI via LINE Bot.

## Problem

Traditional rental workflows in Taiwan rely heavily on phone calls, paper contracts, and manual scheduling. Tenants struggle to get timely responses; landlords manage inquiries across scattered channels. The project aimed to consolidate this into a single, accessible system.

## What I Built

- **ASP.NET MVC web application** for landlords and tenants: property listings, inquiry management, appointment scheduling, and contract tracking.
- **LINE Bot integration** allowing tenants to query listings, schedule viewings, and receive status updates directly within LINE — the dominant messaging platform in Taiwan.
- **AI-assisted response layer**: connected the bot to an AI service for handling common tenant FAQ patterns and auto-generating reply suggestions for landlords.
- **Azure-hosted deployment** with SQL Server backend, covering authentication, file uploads for property photos, and admin dashboard.

## Challenges

**LINE Bot webhook reliability**: Ensuring message delivery and idempotent handling of retried webhook events required careful state management on the server side.

**Multi-role access control**: The system needed distinct views and permissions for tenants, landlords, and administrators — implemented via ASP.NET Identity with role-based routing.

**Real-time UX within constraints**: LINE Bot interactions are inherently asynchronous; designing a conversation flow that felt responsive while working within the platform's message format limitations required iterative UX testing.

## Outcome

Presented at the **DLT2024 Symposium** and awarded **Excellent Paper Award**. The system demonstrated end-to-end rental flow automation — from property discovery to appointment confirmation — with measurable reduction in landlord response time compared to manual processes.

## Reflection

This project pushed me to think beyond backend correctness into user-facing product design: how a conversational interface changes the information architecture, and how real-world deployment constraints (LINE API rate limits, Azure cold start) shape engineering decisions. It also reinforced my interest in AI-integrated product development — an area I want to go deeper into through graduate study.
