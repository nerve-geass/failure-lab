# Educational Action Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explain every disabled incident action consistently across Retry Storm and Cache Stampede.

**Architecture:** A pure presentation helper computes availability and an educational reason from action metadata, current state, and available points. `ActionPanel` passes that reason to `ActionCard`; no scenario-specific branches are added.

- [x] Define the shared design and messages.
- [x] Add failing helper tests.
- [x] Implement the helper and wire the action card UI.
- [x] Run Vitest, build, and Playwright.
