# Instructions for AI agents working in this repo

Several agents build the Sellpage Builder in **one shared working tree**,
sometimes at the same moment. These instructions exist because that has already
gone wrong; each rule below names the failure it prevents.

## Before you change anything

1. Read `docs/sellpage/HANDOFF.md` (who has done what, what is next) and
   `docs/sellpage/ARCHITECTURE.md` (the rules and the reasons for them).
2. Run `git status` and `git diff`. Uncommitted changes belong to another agent
   unless you made them. Do not revert, reformat or "clean up" them.

## Roles

| Agent | Owns |
| --- | --- |
| A | Core: Puck integration, page contract (`schemas/`), services, Firebase, auth, `utils/safeUrl.ts`, `ARCHITECTURE.md`. Reviews and commits everyone's work. |
| B | Frontend: blocks (`blocks/`), builder UI, theme and design tokens (`styles/`). |
| C | See `HANDOFF.md`. |

Work inside your own area. If a task needs a change in another agent's area,
make the smallest change that works and say so in your handoff section.

## Updating `HANDOFF.md` — the rule that keeps being broken

**Never write `HANDOFF.md` as a whole file.** It has been replaced wholesale
three times; every time, the shared rules and Agent A's status were deleted,
and the next agent started without them.

- Use a targeted edit (search-and-replace on specific lines), not a
  full-file write or "rewrite the document" operation.
- You may change only: rows and text under **your own** `## Agent X — status`
  heading, the `**Last updated:**` line, the test count under
  `## Repository state`, and `## Next exact task`.
- Do not touch `## Rules every agent must follow`, another agent's section, or
  `## Known gaps / debt` entries you did not add.
- Do not regenerate the file from memory, summarise it, or restyle its tables.
- Afterwards run `git diff docs/sellpage/HANDOFF.md`. **If the diff deletes any
  line outside your own section, undo your edit and redo it.** This check is
  the whole point; do not skip it.

## Sharing the working tree

- Re-read a file immediately before you edit it. Another agent may have changed
  it since you last looked.
- Before creating a file, check that it does not already exist. Two agents once
  created `blocks/blocks.test.tsx` within the same few minutes and one silently
  replaced the other's. If it exists, add to it.
- Do not switch branches, stash, reset, or run `git checkout -- <file>`: the
  working tree is shared, so that moves or destroys another agent's work.
- Do not commit or push unless the user tells you to. Agent A reviews the
  uncommitted work and commits it.

## Changing a block

Full reasoning is in `ARCHITECTURE.md`. The three mistakes already made once:

- **A block change ships to every published page at once.** Published pages are
  stored as data and re-rendered by whatever block code is deployed.
  - A new prop must render exactly as before when it is `undefined` — saved
    pages never have it, because Puck's `defaultProps` only apply to newly
    inserted blocks. Use a render-time fallback (`lineHeight || 1.2`).
  - Do not change what an existing prop does by default. Add an opt-in prop
    instead (e.g. `openTarget`, not a forced `target="_blank"`).
  - When you add props to a block, add the block's **previous** prop set to
    `blocks/blocks.test.tsx` and assert it still renders the same.
- **Sanitize every user-supplied value** with `utils/safeUrl.ts`: `safeUrl`,
  `safeImageUrl`, `safeColor`, `safeCssValue` (border, box-shadow only) and
  `safeBackground`. **A `background` goes through `safeBackground`, never
  `safeCssValue`.** If no sanitizer fits, ask Agent A for one — do not loosen
  an existing one or chain two together.
- **A prop that holds an image URL uses `imageField()`** from
  `blocks/fields.tsx`, not a `text` field. It stores the same plain URL string
  and adds the media-library picker. Render it through `safeImageUrl` as before.
- **Passing `tsc`, lint and tests does not mean the block is right.** Invalid
  CSS strings (`'1px stroke #ccc'`), a width applied twice, and a cropped image
  all pass. Read your own diff, and add a render test for behaviour you add.

## Before you hand off

```
npx tsc -b
npm run lint
npm test
npx vite build
```

Report the real numbers from these runs. Do not copy a test count from an
earlier handoff, and do not claim a file or test you did not leave on disk.
