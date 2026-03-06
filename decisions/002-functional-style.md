# ADR-002: Functional style, no classes

**Status:** Accepted
**Date:** 2026-02-20

## Context

We needed a code style convention for the codebase. The two main options were object-oriented (classes with methods) or functional (plain interfaces + standalone functions).

## Decision

Use **pure functions and interfaces** throughout. No classes anywhere in the codebase.

- Domain types are TypeScript interfaces, not classes.
- Factories are standalone `create<Entity>()` functions, not constructors.
- Type guards are standalone `is<Entity>()` functions, not `instanceof` checks.
- Emitters implement the `Emitter` interface as plain objects with an `emit` function.
- Config loading, merging, and validation are all standalone functions.

## Consequences

- Pure functions compose naturally and are easy to test in isolation.
- No `this` binding issues or inheritance hierarchies to reason about.
- Interfaces + factories provide the same construction guarantees as classes with less ceremony.
- AI coding agents can understand and modify individual functions without needing to hold an entire class hierarchy in context.
