# Focused production security and privacy remediation

Prepared on `security/production-privacy-recovery`, based directly on production
`main` commit `3d7b2e5`. No Phase 2 or demo changes were merged into this branch.
No production deployment, Pages settings change, Cloudflare action, history
rewrite, or actual browser-record reset is part of this work.

## Findings addressed

| Finding | Remediation |
| --- | --- |
| H1: public medical/health narrative | Removed personal medical wording, demographic assumptions and health-progress claims from shipped HTML and startup/fallback objects. Displays use neutral copy or privately saved values. No fictional records or targets are seeded in production. |
| H2: backup-to-HTML injection | Legacy Food log controls now use `createElement`, `textContent` and `dataset` instead of imported HTML attributes. Remaining dynamic control attributes are escaped. Stored and imported data pass shared validation before rendering; imported IDs cannot contain markup/control characters. Hostile names remain inert text. |
| M1: public household defaults | Empty browser profiles have no supplied health goals, demographics or history. Optional browser-local goal settings retain both profiles and existing unedited fields. Existing values are never replaced by shipped targets. The original storage namespace is retained. |
| M3: silent fallback/overwrite and ambiguous restore | Invalid, unreadable, unsupported or conflicting saved state pauses writes. Raw recovery export, unsaved-change export and explicit recheck are available. Imports are validated in memory and written as one complete value only after confirmation. Merge and restore semantics are explicit. |

## Changed files

- `index.html`: neutral static copy/startup, safe DOM log rendering, escaped
  attributes, store integration, import/export delegation, script policy/referrer
  metadata, and suppression of writes caused only by initial card rendering.
- `app/data-safety.js`: shared schema validation, size/depth checks, safe legacy
  normalization, merge/restore rules, original-storage snapshots and guarded writes.
- `app/privacy-ui.js`: optional profile settings, recovery notice/downloads,
  explicit import mode/confirmation and cross-tab protection. User-supplied
  names/records are assigned with DOM properties, not executable markup.
- `app/privacy.css`: styles for privacy/recovery controls, a persistent visible recovery warning and defensive wrapping
  of long record text so mobile navigation remains reachable. Existing design
  identity and original inline styles are retained.
- `sw.js`: versioned static shell containing the new runtime assets. No
  localStorage reset or record migration is performed by the worker.
- `scripts/refresh-security-policy.py`: regenerates the CSP inline-script hashes
  after an approved inline-script edit. It emits no health data.
- `tests/security.spec.js`: fictional malicious-input, legacy compatibility,
  recovery, storage failure, profile-retention and privacy regression scenarios.
- `README.md`: links to these instructions. No dependency changes are required.

## Data preservation and import behavior

The production key remains `healthhub-v5`. The application never calls
`localStorage.clear()` or `removeItem()`. Existing saved profiles, identifiers,
records, Kitchen selection, component weights, checkmarks and compatible unknown
extension fields are retained. The original 139-recipe JSON and specific cooking
directions are byte-identical to the baseline. Original inline styles also match.

Valid old backups need only the previously required selection/log arrays; omitted
legacy fields receive empty structural or null defaults in memory. Missing food
nutrient fields become explicit unknown markers, never invented zero nutrition.
Existing records and profile values are not seeded with another household's data.
No automatic write occurs merely because cooking cards initially render open.

Imports have two modes, each reviewed before writing:

- **Merge** (default): keep existing records on identifier conflicts, combine
  selections and non-conflicting records, deduplicate repeated imports, retain
  existing profile values (including explicitly unset goals), and preserve unknown
  current fields. A genuinely new/recovery browser can receive profile values
  from a valid legacy backup.
- **Restore supplied sections**: replace only fields included by the backup.
  Supplied arrays replace those arrays. Omitted sections remain unchanged. The
  confirmation explains this before the write; it is not a silent full reset.

Unsupported/invalid backups never change current records. Limits include an 8 MiB
backup/serialized candidate, bounded identifiers/text/arrays and nesting depth,
finite numeric values, expected shapes, unique IDs and forbidden prototype keys.
Files requiring unsupported shapes/IDs enter recovery instead of losing records.

## Non-destructive recovery

When saved data cannot be safely loaded:

1. The original storage value remains in place; editing and logging are paused.
2. **Download original recovery file** exports that unchanged string as a private
   file without rendering or executing its contents. The normal export action also
   avoids misleadingly exporting empty fallback state in this situation.
3. Keep the file private. It may contain personal records. Do not commit it,
   upload it to the demo, or paste it into an issue/chat.
4. After the owner confirms the original recovery file has been saved, a validated
   backup can be applied with the reviewed import mode. No automatic reset occurs.
5. **Recheck saved data** explicitly reloads storage without deleting anything.

A quota/write failure leaves the previous saved value intact and offers a separate
private download of unsaved changes. A changed value from another tab or window
blocks stale writes until explicit recheck. The guard also detects same-tab
changes not accompanied by a storage event.

## Security policy

The app declares a meta CSP permitting only approved inline-script hashes and
same-origin script files; it does not allow `unsafe-inline` scripts. Objects and
base URL changes are blocked. Existing Open Food Facts lookup remains the only
external connection allowed by the policy. A no-referrer policy avoids sending
the app URL through ordinary referrer metadata.

Inline styles remain allowed for compatibility with the recovered design. A meta
CSP cannot supply every HTTP-header protection (for example, `frame-ancestors`).
The policy supplements validation and safe DOM rendering; it does not replace
them. No CSP reporting service, analytics or new third-party transfer was added.

After editing inline code, run:

```sh
python3 scripts/refresh-security-policy.py
npm test -- --reporter=line
```

## Validation

The complete production suite is retained. It covers the 139 recipes, Kitchen,
portions, food search, food logging, persistence, removals, backups and offline
startup. Additional security tests cover:

- Malicious IDs, markup, prototype keys, invalid maps/types, duplicate IDs and
  unsupported versions, with unchanged storage on rejection.
- Safe log controls even when validation is deliberately bypassed in an isolated
  browser; no injected DOM nodes or canary execution.
- Valid legacy backup imports and refresh/export compatibility for both profiles,
  including previously saved demographic/custom fields without publishing them.
- Byte-identical recovery exports and no overwrite of invalid/malformed/future data.
- Reviewed merge versus restore, repeated-import deduplication, cancellation and
  oversized inputs rejected before their file reader is called.
- Quota failures, unavailable storage, cross-tab changes and same-tab stale writes.
- Explicitly unset profile goals, fresh-browser restore, optional goal edits and
  preservation of unrelated records.
- Unknown nutrients, hostile text across other display paths, mobile navigation,
  privacy-neutral cold start and CSP operation.

Final complete run: `npm test -- --reporter=line --output=/tmp/hh-remediation-reviewed-results`
— **44 passed (32.6s)**: 16 original production tests and 28 additional checks
across desktop/mobile Chromium. `git diff --check`, JavaScript syntax checks,
original recipe/style comparisons and scoped privacy checks also passed. Tests use
isolated browsers and entirely fictional inputs; no private backup or real user
records were opened. Source comparisons for potentially personal wording report
booleans only, not the values. Test output is kept outside the checkout. Neutral goal-setting and synthetic recovery screens were also inspected visually.
No real Android/iOS device or live food-service verification is claimed.

## Remaining risks and manual steps

- **The live site remains vulnerable until an explicitly approved deployment.**
  Until then, only import trusted self-created backups. Preparing this branch or
  its draft PR does not change production.
- The repository's Pages source is `main`. **Merging this PR would normally cause
  a Pages publication**, so keep it draft/unmerged until deployment is separately
  approved. PR review alone is not approval to deploy.
- After approval, make a private backup first, review the exact production diff,
  verify the deployment asset list, and test startup against actual live headers
  and network destinations. The original live HTTP checks were proxy-blocked.
- Verify the new service worker installs/activates; close old tabs if needed and
  reload. Do not instruct users to clear site data or localStorage to update code.
- Old source, commit diffs/parents, forks, artifacts and offline caches can retain
  previously public content. Removing newest-file defaults is not erasure. No
  history rewrite, artifact deletion or access restriction was performed.
- Profile selection is not authentication. Browser data and downloaded backups
  remain unencrypted and origin-local; no account isolation or synchronization
  was added. Keep backups private and avoid parallel editing in multiple tabs.
- Guarded localStorage writes detect stale data but are not a transactional
  database with atomic cross-process compare-and-swap. A simultaneous-write race
  remains possible; addressing that fully requires a separate storage design.
- Unknown extension fields are preserved as inert JSON, not interpreted as Phase 2
  features. Production does not acquire Phase 2 meal planning through this patch.
- Strictly unsupported records are preserved for private recovery, not silently
  dropped. Any manual correction should use a private copy and be reviewed before
  restoring it. Compatibility cannot be promised for arbitrary malformed data.
- Reports, new fixtures and commit messages contain no actual personal health
  values. A normal source-removal commit still exposes removed old lines in diffs
  and parent history; no non-destructive patch can promise otherwise.
