# Fix EmbedInput ObjectMember Type Error

## Problem

TypeScript error in `nuvoices-studio/components/EmbedInput.tsx:152`:

```
error TS2339: Property 'name' does not exist on type 'ObjectMember'.
  Property 'name' does not exist on type 'FieldSetMember'.
```

## Root Cause

`props.members` in Sanity's `ObjectInputProps` is typed as `ObjectMember[]`, which is a union:

```typescript
type ObjectMember = ObjectField | FieldSetMember
```

- `ObjectField` - represents individual schema fields, has `name` property
- `FieldSetMember` - represents grouped fields (fieldsets), does NOT have `name` property

The current code assumes all members have a `name`:

```typescript
members: props.members.filter((member) => member.name === 'caption'),
```

TypeScript cannot guarantee `name` exists on `FieldSetMember`, so it errors.

## Solution

Add a type guard using the `kind` property to narrow the type before accessing `name`:

```typescript
members: props.members.filter(
  (member) => member.kind === 'field' && member.name === 'caption'
),
```

The `kind` property is `'field'` for `ObjectField` and `'fieldset'` for `FieldSetMember`. Checking `kind === 'field'` first narrows the type to `ObjectField`, which has the `name` property.

## Files to Modify

- `nuvoices-studio/components/EmbedInput.tsx` (line 152)

## Verification

Run type check after fix:

```bash
cd nuvoices-studio && pnpm tsc --noEmit
```
