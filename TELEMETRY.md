# Telemetry Data Guide

This document outlines the telemetry events tracked in the Snap Ledger application, their trigger conditions, and the data properties sent for analysis.

## Overview
Telemetry is handled by `src/lib/analytics.ts`. Events are stored in Supabase table `analytics_events`.
- **Guest Users**: tracked via persistent `anonymous_id` (localStorage).
- **Logged-in Users**: tracked via `user_id` (authenticated) + `anonymous_id`.

## Events Reference

### 1. `app_opened`
- **Trigger**: Fires immediately when the application loads (Component Mount in `App.tsx`).
- **Frequency**: Once per page load / refresh. Does not fire on client-side route changes.
- **Properties**:
  - `userAgent`: Client browser info (auto-injected).

### 2. `transaction_created`
- **Trigger**: Fires when a transaction is successfully saved to the ledger.
- **Sources**:
  - **`manual`**: User clicked "+" and saved via the Transaction Form.
  - **`ai_voice`**: User used Voice Input and the system **auto-saved** (High Confidence).
- **Properties**:
  - `source`: `'manual'` | `'ai_voice'`
  - `category_id`: Category UUID
  - `category_name`: Readable Category Name
  - `auto_saved`: `true` (Voice specific) | `false` (Manual)
  - `confidence`: Confidence Score (Voice only)

### 3. `category_created`
- **Trigger**: Fires when a **new** category is created.
- **Sources**:
  - **`manual`**: User created a category inside the Transaction Form.
  - **`ai_voice`**: Voice parser detected a new category and auto-created it.
- **Properties**:
  - `source`: `'manual'` | `'ai_voice'`
  - `name`: Category Name
  - `icon`: Category Icon
  - `type`: `'expense'` | `'income'`

### 4. `feedback_submitted`
*(Stored in separate `feedback` table, but relevant for analysis)*
- **Trigger**: User submits the Feedback form.
- **Properties**:
  - `type`: `'bug' | 'feature' | 'like' | 'other'`
  - `message`: Content content
  - `metadata`: `{ version: '0.1.0', userAgent: ... }`

## Data Analysis Notes
- **Voice Success Rate**: Compare count of `transaction_created` (source: `ai_voice`) vs Total Voice Attempts (metric to be added if needed, currently we track successful creates).
- **Guest vs User**: Filter by `user_id IS NOT NULL` to segregate cohorts.

## 💡 Key Insights & SQL Queries

### 1. Voice Adoption Rate
*Are users preferring Voice over Manual entry?*
```sql
SELECT 
  properties->>'source' as input_method, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM analytics_events 
WHERE event_name = 'transaction_created' 
GROUP BY 1;
```

### 2. Voice Confidence (Auto-Save Rate)
*How often is the AI trusted (High Confidence)?*
```sql
SELECT 
  COALESCE(properties->>'auto_saved', 'false') as was_auto_saved, 
  COUNT(*) 
FROM analytics_events 
WHERE event_name = 'transaction_created' 
  AND properties->>'source' = 'ai_voice' 
GROUP BY 1;
```
- **High `true`**: AI is performing well.
- **High `false`**: Users are manually correcting the AI results.

### 3. User Retention (DAU/MAU)
*Daily Active Users based on App Opens.*
```sql
SELECT 
  DATE_TRUNC('day', created_at) as survey_date, 
  COUNT(DISTINCT anonymous_id) as unique_users 
FROM analytics_events 
WHERE event_name = 'app_opened' 
GROUP BY 1 
ORDER BY 1 DESC;
```

