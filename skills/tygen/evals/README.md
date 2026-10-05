# Local evaluation

Run TyGen responses and generated consumer code through Claude, then grade each independent response with the repository's skill-creator grader. The executor receives the prompt and optional skill, never the assertions or expected answer. Each case runs with and without the skill. Compiler and runtime checks determine the consumer's executable assertions, not the grader's opinion.

## Run

Use Node.js 20+, Python 3.10+, an authenticated Claude CLI compatible with your configured model, and an app checkout with TypeScript and `@cognite/sdk` installed. Supply the `types.ts` and `views.ts` generated for `cdf_idm:CogniteProcessIndustries:v1`. The consumer case uses its `CogniteEquipmentView` export. Keep this fixture fixed when comparing skill revisions.

```bash
cd /path/to/builder-skills
export TYGEN_APP_DIR=/path/to/dune-checkout
export TYGEN_FIXTURE_DIR=/path/to/generated-sdk

node --test skills/tygen/evals/*.test.mjs
node skills/tygen/evals/run-local.mjs /path/to/new-iteration-directory
```

The results directory must not exist. Runs use the CLI's configured model, disable tools and customizations, and cost up to $1 per executor or grader invocation. A full six-case run makes 24 invocations. Two Claude sessions run concurrently. Authentication errors and malformed results fail the run. Failed assertions in the with-skill variant produce a nonzero exit status. Baseline failures are recorded without failing the run.

Optional environment variables:

- `EVAL_IDS=1,2,6` selects cases.
- `TYGEN_SKILL_FILE=/path/to/previous/SKILL.md` evaluates a saved skill revision against the same cases.
- `CLAUDE_COMMAND='["npm","exec","--yes","--package=@anthropic-ai/claude-code@2.1.280","--","claude"]'` selects a compatible CLI without updating the global installation. Omit this when the installed `claude` works.

## Review

The runner preserves the skill and case definitions, Claude JSON responses, model usage, timings, grader output, and consumer compiler/runtime evidence. It records fixture hashes and installed SDK/compiler versions for consumer cases. Output follows the skill-creator `eval-N/{with_skill,without_skill}/run-1/` layout.

```bash
python3 skills/skill-creator/scripts/aggregate_benchmark.py \
  /path/to/iteration --skill-name tygen
python3 skills/skill-creator/eval-viewer/generate_review.py \
  /path/to/iteration --skill-name tygen \
  --benchmark /path/to/iteration/benchmark.json \
  --static /path/to/review.html
```

Read the grader's evidence and critique, not just the pass rate. Keep old results unchanged, rerun stronger cases against the original skill, then compare the revised skill on those same cases.

## Coverage

Cases 1–5 test response contracts: alpha gating, local CLI selection, native SDK consumption, regeneration, and picker/authentication guidance. They do not execute the proposed commands. Case 6 compiles Claude-written code against supplied generated files and the real SDK. It exercises that consumer with a fake `instances.list` transport, including missing properties, non-string names, and wrong-space/version data. The checker has positive and deliberately broken controls.

This is explicit skill injection, not automatic skill discovery. It does not test Dune app skill visibility, live CDF authentication, or fresh live generation. The fixture contains generated schema, not project credentials or instance data. Review it before submitting it to Claude. One sample per case is diagnostic evidence, not a statistically stable CI threshold. No CI workflow is added here.
