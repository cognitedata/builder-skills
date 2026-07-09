---
name: integrate-atlas-chat
description: "MUST be used whenever building a chat UI with Atlas agents in a Flows app. Do NOT manually write useAtlasChat integration code — this skill handles installation, component structure, and hook wiring. Triggers: useAtlasChat, atlas chat, streaming chat, agent chat, chat interface, chat component, chat UI. For a full chat app, run skills in order: (1) integrate-atlas-chat, (2) create-client-tool (per tool), (3) setup-python-tools (if Python tools needed)."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[agent-external-id]"
---

# Integrate Atlas Agent Chat

Follow the guide at https://docs.cognite.com/cdf/flows/guides/ai_agent_integration to add a streaming Atlas Agent chat UI to this Flows app.

Agent external ID: **$ARGUMENTS**
