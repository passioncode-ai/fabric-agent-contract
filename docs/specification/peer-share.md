# A credential shared with another person's estate: `fabric-peer-share/1`

DEC-0142 · schemas [`peer-share-frame`](../../schemas/peer-share-frame.schema.json),
[`peer-share-envelope`](../../schemas/peer-share-envelope.schema.json),
[`peer-share-report`](../../schemas/peer-share-report.schema.json),
[`peer-share-record`](../../schemas/peer-share-record.schema.json) · reference [`src/peer-share.ts`](../../src/peer-share.ts) ·
vectors [`peer-share.json`](../../fixtures/vectors/peer-share.json) (`test/peer-share.test.ts`)

How one person shares a credential from their estate with another person's estate, sees its use and takes it back.
Neither side needs an organization: the trust root is the link the sender gives the recipient and a six-digit code the
two people compare. Asked by Project Observatory (board request `c50f590b`, its row OBS-262; its design
`docs/design/PERSON-SURFACES.md` at `b0bb0abd`, D2, D3 and D8), for the operator's ask of 2026-10-26: share keys with
other people's Observatories, track their use, revoke. Between two personal estates from the first version (its reply
`1623e11f`, 2026-10-27).

## Who and what (PS-1)

- **The sender** shares one or more credentials, each a vault slot of their estate, under one share and one comparison
  of codes. **The recipient** is another person, with their own estate, on one machine. A share binds that one machine; a second machine of the recipient needs its own share.
- **No organization** on either side, and none is needed: no DEC-0111 organization key, no membership. An organization
  both people belong to may add its own checks later, never as a precondition.
- **Never a subscription sign-in.** A person's account under a provider's terms (a coding agent's monthly plan) is
  never shared. A key minted for the share is the recommended value: it can be revoked alone and carries its own
  ceiling.

## The share's keys (PS-2)

Each side makes a fresh P-256 key pair for the one share, `#sig` (ES256) and `#kem` (HPKE DHKEM(P-256)), and uses it
for nothing else: never its device keys, never another share's, never an enrollment's. Two shares, or a share and an
organization enrollment, cannot be linked by a key (DEC-0128 UE-1 applied to shares). Keys travel as public JWKs
(`peerJwk`: exactly `kty`, `crv`, `x`, `y`, a point on the curve) and are named by their RFC 7638 SHA-256 thumbprint
(`peerThumbprint`); a side's two keys are different keys (`peerKeys`).

## A share is not a context (PS-3)

`contextId` stays `personal` or `org:<id>` ([contexts](contexts.md)). A received share is neither: the recipient's node
holds its value apart from every context's vault, under the share's id and slot, and serves it to its agents only
through its own use path, which counts each use for the report (PS-8). A share is not a share grant either: a share
grant (`urn:fabric:share:`, DEC-0086) is an external principal's grant into an organization's context, which this is
not.

Project Observatory proposed a context kind `share:<id>`. The contract does not add one: the word is taken by share
grants and share registrations, `contextId` is a closed pattern every pinned reader refuses a new kind of, and a
context places agents and grants, while a share places one value. Kept apart from the vaults, the value has the same
separation the proposal wanted, with no reader's pattern changed.

## The link (PS-4)

`https://<mailbox origin>/s/<shareId>#c=<code>&k=<fpr>` (`parseShareLink`, `shareLink`; the link is read after WHATWG URL
normalisation, so a dot segment, an upper-case host or an empty `:@` reads as the same parts):

- the mailbox's HTTPS origin (PS-10), no user information, no query; the path `/s/` and the share id, 16 random bytes
  the sender's node draws as 32 lower-case hex digits, never derived from a name, a path or an id of either estate;
- a fragment with exactly `c`, the claim code (16 random bytes, unpadded base64url, single use, answering until the
  share's claim deadline, at most 7 days after the share is made), and `k`, the thumbprint of the sender's share
  `#sig`, each once, in either order. A browser sends no fragment in a request, so it stays out of request lines,
  proxy logs and referrers.

**The pin.** The recipient's node pins the sender's share `#sig` from `k` only when the link reaches the recipient's
app as the sender sent it (pasted into the app, or opened by the app's own scheme carrying the `k` the person can see
in the link they were sent): then it aborts unless the sender's commit frame names that key (`pinHolds`). A link
handed over by the mailbox's landing page carries no pin, because the page is the mailbox's own script, and that share
rests on the comparison code alone (PS-6). A product's own scheme for the hand-over follows the link grammar of
DEC-0040 (FL-1 to FL-6); no claim code is ever put in a `fabric://` link.

## The claim (PS-5)

After the person accepts on the recipient's side, the recipient's node sends a claim frame (`peer-share-frame/1`,
`step: "claim"`): its share keys, its commitment (PS-6) and `mac`, HMAC-SHA-256 keyed with the code's 16 bytes over the
UTF-8 RFC 8785 form of `{type: "fabric-peer-claim/1", shareId, keys, fpr}` (`claimMac`). The sender's node checks the
MAC (`claimHolds`, constant time); the mailbox relays the claim and checks no MAC.

The MAC filters claims to those of a link's holder. **It authenticates nothing against the mailbox:** the landing page
is the mailbox's script and can read the code, so a mailbox, or anyone who read the link first, can claim with keys of
its own and a MAC that holds. The comparison code is the defence against that, and nothing else is.

**One claim per link, whatever its MAC.** The mailbox cannot check a MAC, so every claim it carries counts: the first is
the link's one claim, and a second burns the link (PS-6). When the first claim's MAC does not hold, the sender's node
refuses it and the link is spent. Whoever learns the share id, which travels in the request path unlike the fragment,
can therefore burn a link, never take it; the sender makes a new share.

## The comparison code (PS-6)

DEC-0084's construction ([ceremonies](ceremonies.md#add-a-machine)) under the share's own types, both sides committing
before either reveals:

1. The recipient's claim carries its commitment, and the sender's node answers with a commit frame (`step: "commit"`)
   carrying its share keys and commitment. `peerCommit`: `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form of
   `{type: "fabric-peer-commit/1", shareId, role, keys, nonce}`, `role` `sender` or `recipient`, `nonce` 32 random bytes
   in unpadded base64url.
2. Each side reveals its nonce (`step: "reveal"`) only after it holds the other side's commitment, and checks the
   other's reveal against its commitment (`checkPeerReveal`).
3. Both apps show the code, computed only through `checkedPeerCode`: the transcript is the UTF-8 RFC 8785 form of
   `{type: "fabric-peer-code/1", shareId, sender: {keys, nonce}, recipient: {keys, nonce}}`, the code the first five
   bytes of its SHA-256 as a big-endian integer, modulo 10^6, six digits with leading zeros. It binds both sides' keys,
   both nonces and the share.
4. The two people compare the codes by a call or a thread they already trust. After the exchange completes, the
   sender's node seals nothing until the sender either confirms they match or chooses "Share without comparing"; the
   second seals to a key nobody confirmed (trust on first use), and the sender's screen records the share as
   `confirmed: false` and says so: whoever claimed first may hold the value, and when the link went through the
   mailbox's page nothing checked the recipient. An uncompared share also leaves the recipient unable to tell who
   sealed what it holds: a mailbox in the middle can seal a value of its own choosing, so the recipient's app shows
   its code with "They differ" too. Nothing the recipient receives says whether the sender compared, so its app cannot
   know, and its own comparison is its only check. Both are the person's own acts: each is declared with `gate: human` and `humanStep:
   comparison` (DEC-0121 AP-4), so the agent's tool for it answers `human-step-required` with the link to the node's page that shows the pending share and names the app
   window that holds the comparison,
   and no agent can confirm a code or skip the comparison for the person. The product declares its other buttons under
   DEC-0121 too; "They differ" and the recipient's "Decline" only stop a share.

**One attempt per link, at both ends** (`peerExchangeVerdict`, which the sender's node, the recipient's node and the
mailbox each run over the frames in the order received): claim, then commit, then the two reveals in either order,
then at most one `abort` after completion (a person said the codes differ). The exchange burns on a frame out of that
order (`out-of-order`), a second frame of one step and role before completion (`repeated`, a second claim included), a
reveal that does not open its commitment (`commit-mismatch`), an abort before completion or the one after it
(`aborted`), any other frame after completion and anything after that abort (`closed`), a frame of another share or
another shape (`malformed`), or the claim deadline passing before completion (`expired`). An abort before completion
is `aborted` wherever it comes, before any claim included, never `out-of-order`. A frame of another share or another shape is `malformed` wherever it comes, before any other
reason. A commit that reflects the claim's own keys is not a burn of the verdict: it stops at the code, which
`checkedPeerCode` refuses as `same-keys`, so nothing is sealed. A node keeps the first burnt verdict it reaches and reads the share no further: the verdict carries no arrival times, so `expired` holds only for a
node that kept it. Once the sender has confirmed or shared without comparing, the sender's node runs the verdict no
further: it reads only the mailbox's answer to its upload and any later claim or abort the mailbox carries. The mailbox, which
cannot see the confirmation, stops at the first envelope stored for the share. The mailbox learns the share is sealed from the first envelope
stored for it, and still carries a claim that arrives after that to the sender's node, which shows it beside a share
sealed without comparing as a warning to take the share back. A recipient's "They differ" after that point stops its
own node, which opens nothing more for the share and deletes its ciphertext, and the mailbox carries its `abort` to the
sender's node the same way, as a warning to take the share back. Until the first envelope is stored the mailbox keeps
running the verdict: a frame that burns the exchange there (a claim after completion is `closed`) it carries to both
nodes with its reason, and it then stores no envelope and grants no lease for the share, refusing the sender's upload
with the burn, so a share sealed in that moment is never served and the sender's screen reads it burnt. A burnt exchange seals nothing. A new attempt is a new share, with a new id and a new code, that
the sender makes. The recipient's app reveals a nonce for a share id once and never again, so a mailbox posing as the
sender cannot rerun the recipient's side for fresh codes.

**Why this bound holds.** A party in the middle runs one exchange with each side, and each of its commitments is fixed
before it learns the honest side's nonce, so each code is a fresh random value it cannot steer: they match with
probability 10^-6, one guess per link (RFC 6189 §4.4.1.1, as DEC-0084 reads it). Keys travel in the clear in the claim
and the commit frames; the nonces carry the bound.

**Departures from Project Observatory's proposal**, each with its reason:

- both sides commit, then both reveal (DEC-0084's order, one order for every comparison code of the contract), where the
  proposal had the asymmetric order (the recipient commits, the sender answers its nonce in the clear, the recipient
  reveals); the bound is the same;
- the code is the first five bytes, not four, as DEC-0084's is;
- the code's transcript and the claim's MAC are over RFC 8785 objects with a `type`, not a concatenation of unspecified
  encoding, so no two inputs read alike and no MAC or code of one kind is one of another;
- the claim deadline is at most 7 days, where the proposal had 7 days by default, so a link cannot wait for its claim
  indefinitely;
- the lease is at most 24 hours (the proposal: one hour by default, set by the sender), so a sender's stop reaches an
  honest recipient within a day whatever was set;
- an envelope lives at most 90 days, so a value is sealed again at least that often and an old ciphertext stops opening;
- a usage report carries no random nonce: its sequence and the header bound into the additional data already refuse a
  replay or a report moved between shares (PS-8);
- requests to the mailbox are signed with DEC-0056's construction and the share keys (PS-10), not D8's own scheme with
  the node's `#sig`: one request-signing construction in the contract, and the share keys keep a share apart from the
  device keys (PS-2).

## The envelope (PS-7)

`fabric-peer-share-envelope/1` is `{header, ct, sig}`: the value sealed with HPKE (RFC 9180) base mode, suite
`[16, 1, 1]` as the [secret envelope](relay.md#the-secret-envelope), to the recipient's share `#kem`, `info` the ASCII
`fabric-peer-share-envelope/1`, the additional data the RFC 8785 bytes of the header; `sig` is ES256 by the sender's
share `#sig` over the RFC 8785 bytes of `{header, ct}`. The header names `type` (`fabric-peer-share-envelope/1`), `alg` (`ES256`), `suite`, `recipient` and
`signer` (thumbprints), `shareId`, `slot`, `provider`, `sequence` (the sender's, per share and slot), `iat`, `exp` (a
life of at most 90 days) and `enc`; never the value. A share's envelope never opens as a personal credential or an
organization's (DEC-0111), nor the reverse: the `info` differs.

`checkPeerShareEnvelope(envelope, context)` runs every check short of opening, in this order, the first that fails
naming the refusal: `malformed` (shape, a clock, marks or a revocation flag that do not read), `unsupported-alg`, `wrong-share`,
`wrong-recipient` (not this share's `#kem`), `bad-key` (an `enc` off the curve, or a signer other than the sender's
share `#sig` confirmed in the exchange), `bad-signature`, `revoked` (a revocation stands, PS-9), `replayed` (a sequence
below the mark for the share and slot) and `sequence-reused` (another envelope at the mark's sequence; the same
envelope again passes), `not-yet-valid` (`iat` more than 60 s ahead), `lifetime-too-long`, `expired`.
`openPeerShare` then opens it (`cannot-open` when it does not). The node writes the mark `{shareId, slot, sequence,
digest}` with the ciphertext.

- **Serving.** The recipient's node keeps the ciphertext sealed on disk and opens it in memory at each use, for the one
  process that uses it.
- **The lease.** The mailbox grants an honest recipient a lease of at most 24 hours (one hour unless the sender sets
  another) at each renewal, and counts a delivery. The recipient's node opens a ciphertext only while it holds a live
  lease. A lease binds only an honest recipient: the node holds the key that opens the ciphertext, so nothing technical
  stops a modified one (PS-9).
- **Rotation.** When the sender's value changes, the sender's node seals the new value to every active recipient under
  the next sequence, and their next renewal picks it up.

## Usage reports (PS-8)

The recipient's node sends, at each renewal and at least daily, `fabric-peer-share-report/1`: a body sealed with the
same construction to the sender's share `#kem`, `info` the ASCII `fabric-peer-share-report/1`, signed ES256 by the
recipient's share `#sig`; the header names `type` (`fabric-peer-share-report/1`), `alg` (`ES256`), `suite`,
`recipient`, `signer`, `shareId`, `sequence`, `iat` and `enc`, as `peer-share-report.schema.json` gives them. The body
(`peer-share-report.schema.json#/$defs/body`, `peerReportBody`) holds, per slot and UTC day, the uses the node counted
and the last one, the consumer labels (agent names from its journal) and the exports made with the export button; never
a value, a command, an argument or an output (the rule of `call-record/1`, DEC-0111 item 6).

`checkPeerReport` refuses, in order, `malformed`, `unsupported-alg`, `wrong-share`, `wrong-recipient`, `bad-key`,
`bad-signature`, `replayed` (a sequence not above the last one the sender read) and `not-yet-valid`; `openPeerReport`
then opens it (`cannot-open`) and reads the body (`bad-body`). The header is the additional data and the signature
covers it, so the mailbox can neither move a report between shares nor play one again; it may drop a repeated
`(shareId, sequence)` before storing it.

A modified recipient can under-report. The sender's screen shows the reports as reported by the recipient's machine,
beside the mailbox's own delivery count and the provider's spend, which the recipient cannot hide. An export with the
button is not the only way a value leaves: any command an agent runs with it can print it. The screen never says a
value was not exported; it says how many exports were made with the button.

## Taking a share back (PS-9)

Started in this order, each step shown with what confirmed it:

1. **The mailbox refuses.** The sender's node sends `peer-share-revocation/1` (`{type, shareId, at, signer, sig}`,
   signed by the sender's share `#sig`); the mailbox holds it and refuses every renewal and delivery for the share from
   then on, observed by the sender against the mailbox.
2. **The recipient deletes.** At its next contact the recipient's node learns the revocation, deletes the share's
   ciphertexts and lease, and returns `peer-share-deletion/1` (`{type, shareId, at, revocation, signer, sig}`, signed by
   the recipient's share `#sig`, naming the revocation by `peerDigest` of the signed revocation, `sig` included), reported
   by the recipient's machine. `peerRecordStands` checks either record's shape and signature against the key that signs
   it; which revocation a receipt answers the sender's node compares with the digest of the revocation it sent.
3. **The provider ends it.** A value that reached another machine can have been copied by that machine's owner (from a
   running process's environment, or by a modified client). Stopping service ends access through the recipient's node;
   it does not unlearn a copy. Only the provider ends a copied value's power: a key minted for the share is revoked at
   the provider, a key of the sender's own is rotated.

A screen says "taken back" only when step 1 is observed and step 3 is confirmed.

## The mailbox (PS-10)

The mailbox is any HTTPS service the sender names as the link's origin: hosted in the sender's own account, or later
by a personal cloud. It carries frames, envelopes, reports and records unchanged and holds revocations; it signs
nothing, opens nothing, and decides nothing about a value or about whom the sender trusts. Its own duties are
mechanical: it runs `peerExchangeVerdict` over a share's frames and stops carrying the exchange of a burnt one, runs no
verdict after the first envelope stored for the share but still carries a later claim or abort to the sender (PS-6), carries
the frame that burns an exchange to both nodes with its reason and then stores no envelope and grants no lease for that
share, grants
an honest recipient a lease of at most 24 hours and counts each delivery (PS-7), and refuses every renewal and delivery
after a revocation (PS-9). The recipient's node never opens a ciphertext on a lease older than 24 hours from its grant,
whatever the mailbox said.

- **Requests** to it are signed with DEC-0056's construction ([devices](devices.md)'s table: components `@method`,
  `@target-uri`, `content-digest`; parameters `created`, `nonce`, `keyid`, `alg`, in that order) under the label
  `fabric-peer-share` in place of `fabric-device`, `keyid` the RFC 7638 thumbprint of the signing share `#sig` in place
  of a certificate's serial, `alg` `ecdsa-p256-sha256`, the mailbox keeping each share's nonces for the 300 s window,
  by the share key of the side that sends them, the recipient's from its claim
  on; a share's creation by the sender's share `#sig` and a key the product registers for the mailbox's owner.
- **The landing page** at the share's path sends nothing of the fragment to the server. It may read it to build the
  product's deep link, which is why that hand-over carries no pin (PS-4).
- **What it sees:** ciphertext and names. Even blind to values and reports, it learns the share's existence and id,
  the sender's labels for the recipient and the keys unless the product seals them, the number of keys, end dates, the
  time and frequency of every claim, renewal and report, and the IP addresses of both machines. Whoever controls the
  account it runs in can read those.
- **Times** in every message are UTC instants ending in `Z`, the relay family's form; the schemas' pattern admits a day
  or a second that does not exist, and the reference refuses it (`instant`, as relay.md reads times), so a port checks
  the calendar too.
- **Its HTTP routes and its name** are the product's, not the contract's (Project Observatory's `observatory-cloud/1`):
  the contract fixes the frames and sealed messages that cross between the two estates and what the mailbox may see and
  do. The routes are not fixed (CT-185): until a decision fixes them, a recipient claims, renews, reports and returns its
  receipt only through a product that speaks the sender's mailbox's routes, so two different products agree on every
  message and still need those routes in common.

## Not decided here

The mailbox's HTTP routes (CT-185), and the signed record it leaves when it moves to another host; a recipient's second machine
(until an estate carries a share between its own machines); sealing the sender's labels; using the mailbox for sealed
transport between one person's own machines when no relay is deployed. Who pays for a share's use and how a meter
reads it (CT-187): spend-policy rule 1 refuses a source that is neither the project's own key nor another agent's
capability, so until that is decided a recipient's metered agent cannot use a share, and the sender's totals count
another estate's use.

## Reference and vectors

| What | Function | Vectors (`peer-share.json`) |
|---|---|---|
| keys, thumbprints | `peerJwk`, `peerKeys`, `peerThumbprint` | `keys` |
| the link and the pin | `parseShareLink`, `shareLink`, `pinHolds` | `links`, `pins` |
| the claim | `claimMac`, `claimHolds` | `claims` |
| commit, reveal, code | `peerCommit`, `checkPeerReveal`, `peerComparisonCode`, `checkedPeerCode` | `codes` |
| one attempt per link | `peerFrame`, `peerExchangeVerdict` | `exchanges` |
| the envelope | `sealPeerShare`, `checkPeerShareEnvelope`, `openPeerShare` | `envelopes` |
| usage reports | `sealPeerReport`, `peerReportBody`, `checkPeerReport`, `openPeerReport` | `reports` |
| revocation, deletion | `signPeerRecord`, `peerRecordStands` | `records` |
| requests to the mailbox (PS-10) | none: the DEC-0056 reference reads only its own label and a certificate's serial | none until CT-185 |

The 7-day claim deadline and the 24-hour lease are bounds the sender's node and the mailbox keep; the reference checks
neither (`MAX_CLAIM_DAYS` and `MAX_LEASE_SECONDS` name them), and no vector carries them until the mailbox's routes do
(CT-185).
