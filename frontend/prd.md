# PRD: OmniSight Frontend (MVP)

## 1. Project Overview
OmniSight is an AI-driven Risk Intelligence platform for the Consumer Electronics industry. It leverages autonomous agents to scrape global news, identify supply chain/market threats, and suggest mitigation strategies.

Design Philosophy: Minimalist, high-density information, "Vercel V0" aesthetic (Geist Sans, subtle borders, heavy use of monochrome with semantic color accents).

## 2. Refined Feature Requirements

### 2.1 Access-Block (Authentication Gate)

Requirement: A "Glassmorphism" styled login overlay.
UI Components: Simple Email/OTP or Clerk/NextAuth integration.
Logic: Protect all dashboard routes (/dashboard/*) from unauthenticated access.

### 2.2 Entity Context Engine (Company Input)

Requirement: A multi-step onboarding form to define the "Target Profile."
Fields: Company Name, Primary Product Lines (e.g., "Lithium Batteries"), Key Competitors, and Regional Focus.
Impact: This data is passed to the Google AI SDK to filter news scraping relevance.

### 2.3 The "Risk Engine" Dashboard

This is the core view, combining the List View and Kanban View logic from your references.

#### A. Risk Intelligence Feed (The Cards)

Severity Scoring: Automatically calculate RiskScore=Severity×Likelihood.
AI Insights: Each card must render:
Source Citation: Link to the scraped news article.
Risk Synopsis: AI-generated summary of the threat.
Mitigation Roadmap: 3–5 actionable steps suggested by the agent.
Visuals: Semantic colors (Red for Critical, Amber for Medium, Blue for Info).

#### B. Action Item Board (Jira-style)

Functionality: A drag-and-drop interface (using @dnd-kit or pragmatic-drag-and-drop) to move mitigation steps from "Suggested" to "In Progress" to "Resolved."
Columns: Identified, Mitigation Active, Resolved/Archived.

### 2.4 Automated Monitoring (Real-time Updates)

Requirement: A "Live" status indicator showing when the agents last scraped the web.

Implementation: SWR or React Query for polling the backend, or WebSockets for "Agent Found a Risk" toast notifications.

## 3. UI/UX Specifications (V0 Style)

Component Library Needs:
Cards: Bordered (border-slate-200), slight shadows, sans-serif typography.
Badges: Small, pill-shaped tags for "Category" (e.g., Supply Chain, Regulatory, Geopolitical).
Data Tables: For high-density sorting of risk factors.
<!-- Sorting & Filtering Logic: -->
<!-- Filter by Level: Toggle between Critical (Score≥20) and Low (Score≤5). -->
<!-- Filter by Category: Multi-select chips for different electronics sectors. -->

## 4. Technical Implementation Notes (For Next.js)
State Management: Use Zustand for global company context and current risk filters.

API Integration: (Tentative for now.)
* GET /api/news: Fetches relevant news articles based on the company context.
* GET /api/risks/{newsId}: Fetches the risk factors associated with a specific news article.
* GET /api/mitigators/{riskId}: Fetches the mitigation suggestions associated with a specific risk factor.
<!-- * POST /api/context: Updates the company context. -->

AI Orchestration: Utilize Google AI SDK (Gemini 2.5 Flask) for real-time text summarization and risk scoring based on the raw scraped JSON data. (backend.)

## 5. Success Metrics
Time to Insight: A risk manager should understand the top 3 threats within 10 seconds of login.

Actionability: Every detected risk must have at least one AI-generated "Course of Action."