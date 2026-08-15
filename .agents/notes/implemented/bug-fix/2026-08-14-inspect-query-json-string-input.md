# Agent Note: cordis_inspect_query accepts a JSON-encoded string input

Status: implemented

English | [中文](2026-08-14-inspect-query-json-string-input.zh.md)

## Problem

`cordis_inspect_query` declares its `input` parameter as `type: 'json'`, which compiles to an untyped wire property. On the anthropic-messages API, GLM-5.2 serializes untyped properties as JSON-encoded strings, so the model emitted `"input": "{\"service\": \"tokenMeter\"}"`. The string passes tool argument validation — an untyped parameter accepts any JSON value, and a string is one — and then the Inspect provider's `{ "type": "object" }` input schema rejects it with `"input" must be an object`. Every exact Service/Event query on that provider therefore failed while catalog queries (no `input`) worked, and the failure named the validation, not the encoding.

## Decision

`cordis_inspect_query` decodes a string `input` with `JSON.parse` before provider-schema validation (`decodeInspectInput` in `@deepseek-ai/dsh-tool-cordis`). A malformed string fails with `input must be a JSON value or a JSON-encoded string` plus the parser reason. The parameter description now states both accepted forms. Decoding lives in the tool that owns the parameter, not in the adapter or the inspect registry: the adapter stays wire-faithful, and the registry keeps validating against the provider's declared schema.

## Alternatives considered

- **Coercing string-encoded objects at the adapter.** Rejected: adapters should carry what the provider sent; other `type: 'json'` parameters (for example `workflow` `args`) may legitimately receive string scalars, and a global coercion would silently change those.
- **Typing the parameter as `type: 'object'` on the wire.** Rejected: the parameter must accept arrays and scalars when a provider method declares them, so `object` would misdescribe it.
- **Leaving it and fixing the caller.** The caller is whatever model the deployment routes; the toolset cannot fix provider-side serialization choices, only meet them.

## Consequences

Exact Inspect queries work on providers whose models encode untyped properties as strings; object senders are unaffected (identity passthrough). The acceptance is visible in the generated tool catalog. A provider that someday sends a non-JSON string still fails, now with a message that names the encoding.
