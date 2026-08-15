# Agent Note: Teach the dynamic Tool definition contract where models read it

Status: implemented

English | [中文](2026-08-14-dynamic-tool-contract-teaching.zh.md)

## Problem

A dynamic Package whose `apply` registers a Tool through `harness.defineTool` without `output.render` defines cleanly, spends an approval and activation round, and only then fails with `harness.defineTool output.render must be a function`. That validation timing is correct — `apply` is the earliest point where the DSL receives the definition, and `cordis_define` deliberately parses the body without running it — but the contract was documented nowhere a model reads before writing code: the `harness` builtin-inspection catalog carried a bare `defineTool(definition: ToolDefinition)` signature, the skill's tool-registration section was three sentences with no example, and `parameters` being a name→schema map rather than a JSON-Schema wrapper was only discoverable by reverse-engineering `dsh-tool-todo`.

## Decision

**Teach the contract in the two surfaces a model consults, and pin the catalog.** The `harness` entry of `HOST_BUILTIN_INSPECTION` (served through the Builtin Inspect Provider) now lists the required `name, description, parameters, execute, output` fields, states that `parameters` is a name→schema map, and marks `output.render` as required with its content-block-array return; its description states that `cordis_define` parses without running and the full contract is enforced when `apply` runs during activation. The `cordis-plugin-development` skill's registration section gains a minimal complete example with those fields filled in. A package test pins the catalog lines so the teaching cannot silently regress.

**Validation stays where it is.** Moving contract validation into `cordis_define` would require executing `apply`, which runs model-authored code before the user approves it; a body-only dry run would not catch apply-time definitions, which is where the observed failures live. The teaching errors thrown by the sandbox at activation remain the authoritative, earliest-resolvable check.

## Alternatives considered

- **Dry-run the body at define time and validate the returned plugin shape** — rejected: the observed failure class lives inside `apply`, so the dry run would not catch it, while define would gain async evaluation, a hang guard, and double execution of body top-level code.
- **Execute `apply` against a recording stub context before approval** — rejected: consent-before-execution is the approval design; validating by running unapproved code trades a round trip for the security property.
- **Move the check into `registerTool` only** — rejected: `defineTool` is the normalizer every definition passes through; validating there already covers direct and indirect registration.

## Consequences

A model that queries Builtins or loads the skill before writing a dynamic Tool sees the full required shape and the parse/apply validation split; the most common single failure (`output.render` missing) is now stated in both surfaces and pinned by test. Activation-time teaching errors are unchanged, so failures that still slip through keep their one-hop repair path.
