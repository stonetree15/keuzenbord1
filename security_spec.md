# Security Specification - Moetjesbord

## Data Invariants
1. **Identity Isolation**: User data (`/users/{userId}/*`) must only be accessible by the owner (`userId == auth.uid`) or a verified satellite.
2. **Email Verification**: Access to write operations requires a verified email address (`email_verified == true`).
3. **Satellite Verification**: A satellite is only verified if they possess the high-entropy `syncSecret` which is stored in a private subcollection (`/config/sync`) readable only by the owner.
4. **Write-Gaps**: Satellites can perform standard actions (attendance, assignments, evaluations) but cannot modify core configuration (corners, students, secrets).
5. **ID Integrity**: Document IDs must be validated to prevent long-string resource exhausting.
6. **Immutable Identity**: `ownerUid` and `id` fields must never change after creation.

## The "Dirty Dozen" Payloads (Red Team Tests)

| # | Action | Path | Malicious Payload | Intent | Expected Result |
|---|---|---|---|---|---|
| 1 | `create` | `/pairing/{attacker_target}` | `{ ownerUid: "target", secret: "guess" }` | Spoof identity without secret | **DENIED** |
| 2 | `read` | `/users/{target}/config/sync` | `get()` | Extract the secret | **DENIED** |
| 3 | `update` | `/users/{target}/config/settings` | `{ totalStudentSlots: 9999 }` | Satellite overrides admin settings | **DENIED** |
| 4 | `create` | `/users/{target}/corners/{junk}` | `{ name: "A", ... }` | Satellite creates fake corners | **DENIED** |
| 5 | `update` | `/users/{target}/students/{id}` | `{ name: "Hacked" }` | Satellite modifies student roster | **DENIED** |
| 6 | `create` | `/users/{target}/interactions/{id}` | `{ cornerId: "X", duration: "A".repeat(1000000), ... }` | Inject 1MB string via field poisoning | **DENIED** (size check) |
| 7 | `delete` | `/users/{target}/attendance/{date}` | `delete()` | Unauthorized deletion by non-admin | **DENIED** |
| 8 | `read` | `/users/{target}/evaluations` | `list()` | Scrape data without active pairing | **DENIED** |
| 9 | `create` | `/pairing/{me_target}` | `{ ownerUid: "target", secret: "valid", role: "admin" }` | Privilege escalation via shadow field | **DENIED** (`hasOnly`) |
| 10| `update` | `/pairing/{me_target}` | `{ ownerUid: "someone_else" }` | Identity swap of existing pairing | **DENIED** (`hasOnly`) |
| 11| `create` | `/users/{target}/interactions/{id}` | `{ ... }` | Write from unverified email account | **DENIED** (`email_verified`) |
| 12| `update` | `/users/{target}/interactions/{id}` | `{ cornerName: "Modified" }` | Modify immutable field after creation | **DENIED** |

## Verification Logic (Pillars)
- **Master Gate**: `isPaired(userId)` validates existence of a secret-verified token.
- **Validation Blueprints**: `isValid[Entity]` helpers enforce strict schemas on all writes.
- **Identity Integrity**: Mandatory `auth.uid` check in all high-level `match` blocks.
- **Terminal States**: (Not applicable to this CRUD flow yet).
- **Secure List Queries**: `allow list` is restricted by `isPaired` or `isOwner`.
