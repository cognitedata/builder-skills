---
name: create-agent
description: "MUST be used whenever scaffolding a new Atlas agent project. Creates agent.yaml and README.md with the correct structure, tool definitions, and instructions. Do NOT manually write agent.yaml from scratch — this skill handles the full scaffold. Triggers: create agent, new agent, scaffold agent, agent project, agent template, cognite agents create."
allowed-tools: Read, Write, Bash, Glob, Grep
metadata:
  argument-hint: "[agent-name — kebab-case, e.g. my-maintenance-agent]"
---

# Create Agent

Scaffold a new Atlas agent project named **$ARGUMENTS**.

## What gets created

```
<agent-name>/
  agent.yaml    # Agent definition — externalId, model, instructions, tools
  README.md     # Quick-start docs and tool reference
```

---

## Step 1 — Gather requirements

Ask the user for the following (skip any they already provided):

| Field | Required | Default |
|-------|----------|---------|
| **Agent name** (kebab-case, used as directory and `externalId`) | yes | — |
| **Display name** | no | same as agent name |
| **Description** | no | — |
| **Model** | no | `azure/gpt-4.1-mini` |
| **Instructions** (system prompt) | no | see default below |
| **Tools** | no | none |

Default instructions when the user doesn't specify:

```
Help users explore and understand the data in this project.
Use the available tools to retrieve data before answering.
When the data is insufficient, say so rather than guessing.
```

---

## Step 2 — Write `agent.yaml`

Create `<agent-name>/agent.yaml`:

```yaml
externalId: <agent-name>
name: <display-name>
description: <description>           # omit key if empty
model: <model>
instructions: |-
  <instructions>
tools:                                # omit if no tools selected
  - name: <tool_name>
    type: <tool-type>
    description: <what-the-tool-does>
    configuration:                    # tool-specific, see examples below
```

### Available tool types

| Type | Purpose |
|------|---------|
| `analyzeData` | Analyze tabular or structured data |
| `analyzeImage` | Analyze images and P&ID diagrams |
| `analyzeTimeSeries` | Analyze time series data |
| `askDocument` | Ask questions about documents |
| `callFunction` | Call a Cognite Function |
| `callRestApi` | Call an external REST API |
| `callWebhook` | POST a payload to an external webhook |
| `examineDataSemantically` | Semantic data examination |
| `query` | Structured queries against CDF data models |
| `queryKnowledgeGraph` | Query CDF data models with natural language |
| `queryTimeSeriesDatapoints` | Fetch raw or aggregated time series data |
| `runPythonCode` | Execute custom Python code |
| `summarizeDocument` | Summarize documents |
| `timeSeriesAnalysis` | Advanced time series analysis and anomaly detection |

### Example — knowledge graph tool

```yaml
tools:
  - name: find_assets
    type: queryKnowledgeGraph
    description: Find assets and related instances in the knowledge graph.
    configuration:
      version: v2
      dataModels:
        - space: cdf_cdm
          externalId: CogniteCore
          version: v1
          viewExternalIds:
            - CogniteAsset
      instanceSpaces:
        type: all
```

---

## Step 3 — Write `README.md`

Create `<agent-name>/README.md` with:

```markdown
# <Display Name>

> Edit `agent.yaml` to configure your agent — tools, model, instructions.

## Quick start

\```bash
# Push agent config to CDF (draft)
cognite agents push

# Open agent in Fusion for testing
cognite agents open

# Publish agent (makes it visible to users)
cognite agents publish
\```

## Project layout

| Path | Purpose |
|------|---------|
| `agent.yaml` | Agent definition (externalId, tools, model, instructions) |
| `README.md` | This file |

## Adding tools

Edit the `tools` array in `agent.yaml`. See the full list of tool types
in the [CLI docs](https://cognitedata.github.io/dune/).

## Deployment with Toolkit

The generated `agent.yaml` is compatible with
[Cognite Toolkit](https://docs.cognite.com/cdf/deploy/toolkit/).
Place it in your Toolkit module under `agents/` and deploy with `cdf deploy`.
```

---

## Step 4 — Verify and summarize

1. Confirm both files were created
2. Tell the user the next steps:
   - Edit `<agent-name>/agent.yaml` — add tools and refine instructions
   - `cognite agents push <agent-name>` — push to CDF for testing
   - `cognite agents open` — open in Fusion

---

## Guard rails

- **Do NOT** create files outside the `<agent-name>/` directory
- **Do NOT** add `tools: []` — omit the key entirely when there are no tools
- **Do NOT** invent tool types not listed above
- Agent name must be kebab-case: lowercase letters, digits, and hyphens only
- If a directory with the agent name already exists, warn the user and stop
