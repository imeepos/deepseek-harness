# Agent Note: Compaction checkpoint carries the shadowed todo list

Status: implemented

English | [中文](2026-08-14-compaction-checkpoint-todo-stub.zh.md)

## Problem

`todo/write` is log-only UI state: the event never derives a model message, so the model's knowledge of its own task list is whatever `todo_write` tool results remain on the surface. Compaction replaces the older surface span with a lossy summary, and whether the summary preserves the progress map is left to chance. After a mid-task compaction the model routinely lost the list — the exact failure mode the progress-state-preservation research ranks as a top context-sovereignty gap: navigation state is cheap, deterministic, and should never depend on summarizer goodwill.

## Decision

**The replacement checkpoint appends one deterministic stub, not a summarized one.** When the latest `todo/write` snapshot is shadowed by the compacted span, `compactSurfaceRegion` appends a `<todo-state>` text block after the `</compacted-summary>` close tag: `- [<status>] <content>` per item, statuses in the tool's own vocabulary. The block rides the same logged replacement user message, so model-visible ⟺ logged holds by construction; replay derivation is unchanged.

**The shadow test is exact, not heuristic.** A `todo/write` is appended between its tool call and result, and balanced pairing guarantees the cutoff never splits that pair. The write is shadowed exactly when its seq is at or below the last shadowed surface node; a write above the cutoff stays visible in the retained tail and adds nothing, so no session pays for a stub it does not need. An empty snapshot adds nothing.

**No configurability.** Injecting the agent's own progress map at its only loss point is a correctness property of the checkpoint format, not a deployment choice; sessions without todo lists are unaffected.

## Alternatives considered

- **Teach the summarizer instruction to preserve the list** — rejected: the stub must be deterministic; a summary line can drop, reorder, or paraphrase statuses, and the failure returns exactly when the list matters most.
- **Inject the list on every request** — rejected: duplicates the visible tail's `todo_write` results turn after turn; the stub is needed only at the loss point.
- **A `todo/write`-derived model message or steering notification after compaction** — rejected: `todo/write` is log-only by contract, and the replacement checkpoint is the one durable, cache-aligned surface that already crosses the boundary.

## Consequences

The checkpoint grows by the current list's lines only when that list is otherwise lost; the shrink check prices the stub because the block is part of the checkpoint message before estimation. The `<todo-state>` tag is now stable model-visible text pinned by the headless compaction e2e and the replay-equality invariant in package tests. A keyless assembled snapshot with a shadowed write remains deferred: recording one requires a live provider transcript, and hand-inserting a tool round into the recorded overflow fixture risks fixture surgery without a key to validate it.
