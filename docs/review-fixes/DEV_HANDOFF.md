# Anticapture: data-integrity review (handoff to the dev team)

_Prepared 2026-11-09, updated the same day (all times in BRT, UTC−3). The review itself was read-only: no private infrastructure was accessed, and nothing was opened, commented on or deployed in `blockful/anticapture`. The proposed fixes are in a PR on my fork (section 0)._

Hi team! While digging into the GTC numbers I asked for a full read-only check of Anticapture's data against the chain, and I'm passing the results on to you here. I'm not a developer, so please read the code-level parts (causes, fixes, effort) as pointers from a teammate rather than a spec. You know the codebase and its trade-offs far better, and some of this may already be known or in progress.

For each item you'll find:

- what was seen;
- how to reproduce it;
- the likely cause;
- a suggested fix.

Everything below can be re-checked with the scripts in section 4. Happy to walk through any of it.

---

## 0. Fix PR: status at a glance

**There is already a PR with proposed fixes:** https://github.com/guiriba-code/anticapture/pull/1

- It lives on my fork (`guiriba-code/anticapture`), targets `dev`, and nothing was opened against `blockful/anticapture`. Please treat it as a proposal. Cherry-pick, rework or close it as you see fit.
- One commit per finding, all in Conventional Commits, with a changeset (including one for `@anticapture/gateful`). Full write-up per finding (problem, change, test, risk, replay block) is in `docs/review-fixes/README.md` on that branch.
- It went through two review rounds. On head `75740d23d`, everything passed in `indexer`, `api` and `dashboard`:
  - `pnpm install --frozen-lockfile`;
  - typecheck and lint (dashboard: 0 errors, 85 warnings that were already there);
  - tests: indexer 22, API 1179, dashboard 957;
  - build: API `tsup` and dashboard `next build`.
- Note for running it locally: `@anticapture/observability` and `@anticapture/client` have to be built first, and the client codegen needs `ANTICAPTURE_API_URL`.

**What the PR fixes**

| Finding                                 | Fix in the PR                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A3 GTC Governor Charlie                 | Charlie `0xef41CbD211076E8b1901e214Bf751d404cf06638` is indexed from block `25776742`. It handles `VoteCast` and `VoteCastWithParams`, and the dashboard targets Charlie. Fractional partial votes from the same voter add weight instead of crashing the indexer. In the API, quorum for OZ hash proposal ids (≥ 2^64) is read from Charlie, and smaller ids stay on Bravo `0x9D4C63565D5618310271bF3F3c01b2954C1D1639`. |
| A1 / A2 GTC votes                       | Abstain is no longer stored as "for". GovernorAlpha `VoteCast(address,uint256,bool,uint256)` is in the ABI.                                                                                                                                                                                                                                                                                                               |
| N13 Nouns / Lil Nouns quorum            | Quorum counts for-votes only, using `quorumVotes(proposalId)` per proposal.                                                                                                                                                                                                                                                                                                                                               |
| N14 Scroll / OP                         | `VoteCastWithParams` is indexed.                                                                                                                                                                                                                                                                                                                                                                                          |
| A5 NFT burns and `/lil_nouns/token` 500 | Burns lower total and delegated supply. The 500 most likely came from an empty `token_price` table, and the endpoint now returns `0` with `degraded: true`. Lil Nouns auctions are indexed. A price older than 7 days stays `degraded: true` because the current minter `0xA2587b1e2626904c8575640512b987Bd3d3B592D` is not indexed. Lil Nouns now uses `0x000000000000000000000000000000000000dEaD` as its dead address. |
| A6 daily series                         | The series uses the UTC close, and the response adds `close` and `partial`.                                                                                                                                                                                                                                                                                                                                               |
| N16 Nouns proposal edits                | `ProposalUpdated`, `ProposalDescriptionUpdated` and `ProposalTransactionsUpdated` are applied.                                                                                                                                                                                                                                                                                                                            |
| A7, A8, N4, N5, N6 lists                | Duplicates are removed and the GTC treasury no longer has third parties. COMP lending is no longer counted as treasury. AAVE and ARB burn entries point at the indexed token. N4 adds the Nansen-confirmed GTC exchange wallets (section 3, P1-1).                                                                                                                                                                        |
| A9 `/health`                            | Freshness comes from the Ponder sync cursor, with a 24 h activity fallback.                                                                                                                                                                                                                                                                                                                                               |
| N1 Fluid                                | The dashboard and treasury list use `governor.timelock()` = `0x2386DC45AdDed673317eF068992F19421B481F4c`.                                                                                                                                                                                                                                                                                                                 |
| N7                                      | A parity test keeps the API and indexer treasury copies in sync.                                                                                                                                                                                                                                                                                                                                                          |

**Fixed in the same PR (commit `98beb6f8c`):** the API used to read GTC `votingDelay` from Bravo (**13140** blocks), while the live Governor Charlie `0xef41CbD211076E8b1901e214Bf751d404cf06638` uses **14400**. `votingDelay`, `votingPeriod` (40320) and `proposalThreshold` (150,000 GTC) are now read from Charlie, so `GET /dao` and the inactive-voters summary use Charlie values. The timelock delay still comes from Bravo, since both governors share timelock `0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518`.

**Left out of the PR, and why**

- **A4, Nouns indexer stopped since 2026-10-19 13:49 BRT:** this is not a code problem. The indexer process needs to be restarted or inspected on the server. The burn fix does not catch it up.
- **N2, old UNI/COMP governors:** lowest priority, and it is a coverage decision for you.
- **N15, UNI proposals 1–8:** a filter in the shared proposals query would also hide test fixtures (tests default to UNI with ids `"1"` and `"2"`). A safe fix needs a governor column.
- **Methodology and naming items:** A10, N3, N8, N9, N10, N11, N12, N17, N18, N19 and N21 are described in the glossary of `docs/review-fixes/README.md`. They are left for your decision.
- **N1 question for the Fluid team:** the old timelock `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC` has `pendingAdmin` = `0x4F6F977aCDD1177DCD81aB83074855EcB9C2D49e`. Is that expected?
- **GTC wallets not added:** the 3 uncertain wallets and 5 smaller exchange wallets that Nansen identified are listed but not added (see P1-1).

**Deploy risks**

- **Historical numbers only change after a replay.** Ponder applies handler and list changes to new logs only. Replay starting points:
  - GTC from token start block `12422079` (CEX list, treasury, abstain, Alpha votes);
  - Nouns and Lil Nouns supply (burns);
  - Lil Nouns auction house `0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E` from `14736713`;
  - Scroll governor from `8963441`;
  - Nouns governor from `12985453` (proposal edits);
  - COMP, AAVE and ARB lists.
- **The GTC ABI change (Alpha `VoteCast` plus Charlie) can make Ponder reprocess GTC at deploy.** Please schedule it rather than treating it as a no-op.
- **What changes immediately, without a replay:**
  - 16 Nouns and 12 Lil Nouns proposal statuses (Nouns 269 becomes `NO_QUORUM`);
  - the `/health` criteria;
  - daily charts use the UTC close, and the current day is `partial: true`;
  - `GET /lil_nouns/token` returns 200 with `degraded: true` instead of 500;
  - the API contract: new `close` and `partial` fields, and `high` on gap days repeats the close. Regenerate `@anticapture/client` from the updated Gateful spec.

---

## 1. Context and scope

**Commits reviewed**

| Component                   | Commit                                                                                        | How we know                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Code reviewed (`dev`)       | `89929c879`                                                                                   | local clone of `blockful/anticapture`, HEAD of `dev` on 2026-11-04     |
| API + Gateful in production | `dea189758bdafb98eca46517c35411d00766c27c` (merge of PR #2170, 2026-09-30 15:55 BRT)          | `commit` field of `GET https://www.anticapture.com/api/gateful/health` |
| Dashboard in production     | `e09f9d116aeba7668efc9b871b1073c6426515d2` (merge of PR #2173, deployed 2026-10-21 08:47 BRT) | GitHub Deployments API, environment "production"                       |

`git diff dea1897 89929c8 -- apps/indexer` is **empty**, so every indexer issue below is live in production. The API files cited in this document are identical between the production commit and `dev`:

- `services/token-metrics`;
- `clients/nouns`;
- `repositories/health`;
- `services/health`.

**Data sources**

- **Public Anticapture API** (`https://www.anticapture.com/api/gateful/{dao}/...`): requests spaced ≥ 0.6 s apart, with exponential backoff on 429/5xx. Cached `/token` responses were bypassed with an extra query parameter (see P2-6).
- **On-chain reads:** `eth_call`, multicall via Multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11`, and `eth_getLogs`, against keyless public archive RPCs:
  - `https://rpc.mevblocker.io`;
  - `https://eth.drpc.org`;
  - `https://eth-mainnet.public.blastapi.io`;
  - `https://rpc.scroll.io`.
- **Etherscan API v2:** used for logs, with a key read from the environment variable `ETHERSCAN_API_KEY`. The key value is not stored anywhere in the deliverables.
- **Ethplorer public API** (`freekey`): top holders.
- **Nansen API** (address labels, premium labels and related wallets; key read from `NANSEN_API_KEY`, value not stored): verification of every GTC exchange label and every unlabelled top-100 holder (see P1-1).

**Scope by area**

1. contract coverage;
2. address lists;
3. indexing freshness/health;
4. delegation and voting power;
5. proposals and votes;
6. supply metrics;
7. dates and daily series;
8. API/frontend;
9. tests and monitoring.

**Out of scope or not possible**

- Private infra (Railway, Loki, Grafana, Postgres).
- Snapshot.
- Attack-cost formulas.
- The relayer.
- ARB/OP/ZK, which are not deployed and were reviewed in code only.

---

## 2. What is correct

These results are worth stating first: the core pipeline is accurate.

- **Voting power:** 900 of 900 sampled accounts match the chain exactly (difference 0).
  - DAOs: UNI, ENS, GTC, COMP, OBOL, FLUID, SHU, LIL_NOUNS and SCR.
  - Sample: top 50 plus 50 random accounts per DAO.
  - On-chain functions: `getVotes` / `getCurrentVotes`.
- **Supply aggregation:** across 9 ERC-20 DAOs, every value equals the on-chain sum of `balanceOf` over the configured lists, to the unit.
  - Values checked: TOTAL, TREASURY, CEX, DEX, LENDING, NON_CIRCULATING and CIRCULATING.
  - Any metric problems below come from list _contents_, NFT burns, or the daily-series aggregation, not from the arithmetic.
- **Proposal counts:** the API matches the on-chain `ProposalCreated` count for UNI, ENS, COMP, OBOL, FLUID, NOUNS, LIL_NOUNS and TORN.
  - Vote totals match for all proposals of those DAOs.
  - That is 2,030 proposals compared via `proposalVotes()` / `proposals()`.
- **`endBlock`:** equals `proposalDeadline()` for 100% of the proposals checked, including 165 extended COMP proposals.

---

## 3. Findings by priority

**Legend**

- Severity: Critical / High / Medium / Low / Info.
- Classification: _code bug_, _incomplete list_, _methodology_, _infra_.
- Effort: **S** (hours), **M** (1–3 days), **L** (a week or more, or needs a product decision).
- IDs (A*, N*) match the detailed area reports in this folder, which are in Portuguese.

### P0: wrong data published today, or imminent risk

#### P0-1 · GTC moved to a new Governor that is not indexed and the dashboard still targets the old one (A3)

- **Severity:** Critical. **Classification:** code bug (configuration). **Effort:** M (config + ABI + reindex + dashboard).
- **User impact:**
  - the next Gitcoin proposal will not appear on Anticapture;
  - propose/vote/queue/execute actions in the dashboard send transactions to the retired governor;
  - the GTC risk texts are out of date.
- **Evidence**
  - On-chain: `admin()` of the GTC timelock `0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518` is `0xef41CbD211076E8b1901e214Bf751d404cf06638`, and `pendingAdmin()` is `0x0000000000000000000000000000000000000000`. The configured governor is `0x9D4C63565D5618310271bF3F3c01b2954C1D1639`.
  - The new contract's own parameters:
    - `name()` = "Gitcoin Governor Charlie" (Etherscan: `GitcoinGovernorWithGuardian`);
    - `COUNTING_MODE()` = `support=bravo,fractional&quorum=for,abstain&params=fractional`;
    - `proposalGuardian()` = `0x5743e35477363241300fcedc2f5eb0195f300817`;
    - `lateQuorumVoteExtension()` = 7200 blocks;
    - `votingDelay()` = 14400, `votingPeriod()` = 40320, `proposalThreshold()` = 150,000 GTC.
  - Logs so far: 7 configuration events and no `ProposalCreated` yet. Nothing has been lost so far, but the next proposal will be missed.
  - Code:
    - `apps/indexer/src/lib/constants.ts:78-86`;
    - `apps/indexer/config/gitcoin.config.ts:20-28`;
    - `apps/api/src/lib/constants.ts:71-78`;
    - `apps/dashboard/shared/dao-config/gtc.ts:34` (`governor`);
    - `gtc.ts:44-52` (risk/rules text).
- **Likely cause:** governance migration happened on-chain and there is no on-chain watcher for `NewAdmin` / `TimelockChange`.
- **Suggested fix**
  - add `0xef41CbD211076E8b1901e214Bf751d404cf06638` to the GTC contracts and the Ponder config with the OZ governor ABI, handling `VoteCast` **and** `VoteCastWithParams` (the contract is fractional);
  - point the dashboard `governor` to it;
  - update the rules text (guardian, late-quorum extension, fractional voting).
- **Suggested test:** an indexer unit test that a `ProposalCreated` from the new address is stored under GTC; a config test asserting the dashboard governor equals the indexer's current GTC governor.

```bash
cast call 0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518 "admin()(address)" --rpc-url https://rpc.mevblocker.io
cast call 0xef41CbD211076E8b1901e214Bf751d404cf06638 "COUNTING_MODE()(string)" --rpc-url https://rpc.mevblocker.io
```

#### P0-2 · Nouns / Lil Nouns: defeated proposals shown as SUCCEEDED (N13)

- **Severity:** High. **Classification:** code bug. **Effort:** S.
- **User impact:** 28 proposals that the DAOs rejected are shown as passed.
- **Evidence**
  - `apps/api/src/clients/nouns/index.ts` (used for NOUNS and LIL_NOUNS via `apps/api/src/lib/client.ts:48-54`):
    1. `calculateQuorum` (lines 82-88) uses `forVotes + abstainVotes`. In Nouns DAO logic a proposal is defeated when `forVotes < quorumVotes(proposalId)`, and abstain does not count.
    2. `getQuorum` (lines 34-48) reads `quorumVotes(proposalCount)`, the latest proposal's dynamic quorum, caches it for 5 min and applies it to every proposal.
  - Example, Nouns 269 on governor `0x6f3E6272A167e8AcCb32072d08E0957F9c79223d`:
    - on-chain `proposals(269)`: for 101, against 78, abstain 57; `quorumVotes(269)` = 135; `state(269)` = Defeated (3);
    - API: quorum 136 (from proposal 1002), 101 + 57 ≥ 136, so SUCCEEDED.
  - Affected Nouns proposals: 269, 725, 797, 863, 883, 900, 911, 912, 920, 927, 929, 941, 951, 963, 964, 978.
  - Affected Lil Nouns proposals (governor `0x5d2C31ce16924C2a71D317e5BbFd5ce387854039`): 48, 61, 80, 84, 91, 92, 99, 131, 158, 169, 307, 345.
- **Suggested fix:** quorum check = `forVotes >= quorumVotes(proposalId)`, read per proposal and cacheable forever once the proposal is closed. Alternatively, read `state(proposalId)` for closed proposals.
- **Suggested test:** regression test with Nouns 269 (101/78/57, quorum 135 → DEFEATED).

```bash
cast call 0x6f3E6272A167e8AcCb32072d08E0957F9c79223d "quorumVotes(uint256)(uint256)" 269 --rpc-url https://rpc.mevblocker.io
cast call 0x6f3E6272A167e8AcCb32072d08E0957F9c79223d "state(uint256)(uint8)" 269 --rpc-url https://rpc.mevblocker.io
```

#### P0-3 · Nouns indexer stalled since 2026-10-19 13:49 BRT (A4)

- **Severity:** High. **Classification:** infra. **Effort:** unknown (root cause not visible from outside); restart/reindex likely S–M.
- **User impact:** Nouns supply, voting power and anything that happened after 19 Oct are frozen (≈ 468 h stale at review time).
- **Evidence**
  - `GET /nouns/health` returns `lastEventTimestamp` = 1792428575 (2026-10-19 13:49 BRT).
  - On-chain, the token `NounCreated` count is 2,069. 17 Nouns were created after the stall (ids 2052–2068). The latest is in block 26367990, tx `0x7f3796751cf09772e415271f51017040a8992c9263e943e1308a1b12e429bd13` (2026-11-08 02:14 BRT).
  - Voting power of the treasury timelock `0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71`: API 665 vs on-chain 682. Account `0x70dc2A4614F057e6D711cd8fF0864dd90BF2fF3d`: API 5 vs 9.
  - `IndexerSyncStale` (`infra/monitoring/alerts.yml:80-90`) only covers a stalled _sync_. If the sync kept advancing while a handler failed, no alert would fire. We could not confirm which case this is.
- **Suggested fix:** investigate the logs, restart or reindex, and add an alert on "on-chain events exist but the indexer's last event is older than X" (see the reconciler, section 5).
- **Suggested test/monitor:** reconciler check `indexer_stalled`.

#### P0-4 · NFT supply ignores burns; `/lil_nouns/token` returns 500 (A5)

- **Severity:** High. **Classification:** code bug. **Effort:** M (handler + reindex Nouns/Lil Nouns); the 500 is unknown.
- **User impact:** Total and delegated supply are overstated (Lil Nouns by ~10%), and the Lil Nouns token page fails.
- **Evidence**
  - Nouns (token `0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03`, `apps/indexer/src/lib/constants.ts:93`): API `totalSupply` = `delegatedSupply` = 2052; on-chain `totalSupply()` = 2043, with 26 burns (`Transfer` to `0x0000000000000000000000000000000000000000`).
  - Lil Nouns: API series TOTAL_SUPPLY = DELEGATED_SUPPLY = 8450 (= all mints); on-chain `totalSupply()` = 7689, with 761 burns.
  - `GET https://www.anticapture.com/api/gateful/lil_nouns/token` → HTTP 500 (reconfirmed ~09:42 BRT).
  - Code:
    - `apps/indexer/src/indexer/nouns/token.ts:149-169` and `apps/indexer/src/indexer/lil-nouns/token.ts:128-148`: only `NounCreated` increments TOTAL/DELEGATED;
    - the `Transfer` handler (`nouns/token.ts:52-147`) has no `to == 0x0` branch.
- **Suggested fix:** on `Transfer` to the zero address, decrement TOTAL (and DELEGATED if the burner's delegate had the vote), then reindex. Investigate the 500 from the API logs.
- **Suggested test:** mint → transfer → burn sequence on a synthetic ERC-721 event stream; assert TOTAL = 0 and DELEGATED = 0 at the end.

#### P0-5 · GTC: abstain votes counted as "for" (A1) and GovernorAlpha votes never indexed (A2)

- **Severity:** High. **Classification:** code bug. **Effort:** S (A1) + M (A2: ABI overload + reindex).
- **User impact:**
  - A1: 6,844,777.25 GTC of abstentions shown as "for" across 20 of 49 proposals on `0x9D4C63565D5618310271bF3F3c01b2954C1D1639`;
  - A2: all 66 GovernorAlpha proposals show 0 for / 0 against, and proposal 66 shows NO_QUORUM although it Succeeded on-chain.
- **Evidence (A1)**
  - `apps/indexer/src/indexer/gtc/governor.ts:19`: `support: event.args.support ? 1 : 0` (same in `apps/indexer/src/indexer/zk/governor.ts:20`, ZK not deployed).
  - Example: "REVOTE: Gitcoin DAO 2026 Budget Request":
    - on-chain `proposalVotes`: for 3,168,028, abstain 1,000,835;
    - API: for 4,168,863, abstain 0.
  - No status changed, because the quorum counts for+abstain.
- **Evidence (A2)**
  - Alpha `0xDbD27635A534A3d3169Ef0498beB56Fb9c937489` emitted 5,036 `VoteCast(address,uint256,bool,uint256)` events, and none are indexed.
  - The indexer ABI (`apps/indexer/src/indexer/gtc/abi/governor.ts:188-219`) only has `VoteCast(address,uint256,uint8,uint256,string)`, and the handler at `gtc/governor.ts:14` listens to both addresses (`gitcoin.config.ts:23-26`).
  - On-chain totals across Alpha proposals: 304,494,570.85 for, 5,736,102.43 against.
  - Of the 11 Alpha proposals shown as NO_QUORUM, 10 are actually Defeated on-chain (15, 17, 18, 19, 25, 38, 44, 48, 54, 55), so the label is right by coincidence.
  - Proposal 66, "[GCP-007] Fund Thin Governance for Season 18", is **Succeeded** on-chain (3,003,567.31 for / 93.21 against).
- **Suggested fix:** pass `support` through as a number (0/1/2); add the Alpha `VoteCast(bool)` event as a separate handler mapping `true → 1`, `false → 0`; reindex GTC.
- **Suggested test:** table-driven vote-handler test per DAO with support 0, 1, 2 and the Alpha bool variant.

```bash
cast call 0xDbD27635A534A3d3169Ef0498beB56Fb9c937489 "proposals(uint256)(uint256,address,uint256,uint256,uint256,uint256,uint256,bool,bool)" 66 --rpc-url https://rpc.mevblocker.io
cast call 0xDbD27635A534A3d3169Ef0498beB56Fb9c937489 "state(uint256)(uint8)" 66 --rpc-url https://rpc.mevblocker.io
```

#### P0-6 · Scroll: `VoteCastWithParams` not indexed (N14)

- **Severity:** High. **Classification:** code bug. **Effort:** M (handler + reindex SCR).
- **User impact:** the "DAO Treasury Management RFP" shows 0 "for" and NO_QUORUM; on-chain it **Succeeded** with 1,806,873.99 SCR for.
- **Evidence**
  - Governor `0x2f3f2054776bd3c2fc30d750734a8f539bb214f0`: `COUNTING_MODE()` = `support=bravo&quorum=against,for,abstain&params=modules`.
  - Proposal id `17736716284166632362836192914377789635944846939193281594888966652732932587143`, blocks 20594763–20997963.
    - On-chain: 79 `VoteCastWithParams` events (1,806,873.99 for), plus 18 `VoteCast` abstain events (614,918.48).
    - API: for 0, abstain 614,918.48.
  - Code: `apps/indexer/src/indexer/scr/governor.ts:14` only handles `VoteCast`. `apps/indexer/src/indexer/op/governor.ts:14` has the same gap, which matters once OP ships.
- **Suggested fix:** handle `VoteCastWithParams` the same as `VoteCast` for totals; for module-based votes, follow the module's semantics if it splits weight. Reindex SCR.
- **Suggested test:** `VoteCastWithParams` fixture in the vote-handler table test.
- **Reproduce:** `rpc.scroll.io` limits `eth_getLogs` to about 10k blocks, so iterate windows over the range:
  ```bash
  cast logs --address 0x2f3f2054776bd3c2fc30d750734a8f539bb214f0 "VoteCastWithParams(address,uint256,uint8,uint256,string,bytes)" --from-block 20594763 --to-block 20604762 --rpc-url https://rpc.scroll.io
  ```

#### P0-7 · Daily metric series shows the day's _high_, not its _close_ (A6)

- **Severity:** High. **Classification:** code bug. **Effort:** S–M.
- **User impact:** large drops show up one day late; normal days are inflated. Example (GTC CEX supply):

| Day (UTC)                                | API point (high) | On-chain close |
| ---------------------------------------- | ---------------- | -------------- |
| 2026-10-12 (Upbit listing)               | 41,534,595.05    | 30,339,646.37  |
| 2026-10-29 (Binance incident, 20:24 UTC) | 33,231,492.66    | 18,709,553.79  |

- **Evidence**
  - `apps/api/src/services/token-metrics/index.ts:115-120` reads only `row.high` from the daily bucket.
  - `applyForwardFill` (lines 196-230) carries `high` forward.
  - `close` exists in `daoMetricsDayBucket` but is unused.
  - The day is truncated at 00:00 UTC, and the current (partial) day is not flagged as partial.
  - Reproduce: `GET /gtc/token-metrics?metricType=CEX_SUPPLY` vs the sum of `balanceOf` over the GTC CEX list at the last block of each UTC day (`a7_datas.py`).
- **Suggested fix:**
  - return `close` (optionally OHLC);
  - forward-fill with `close`;
  - mark the current day as partial;
  - label the UTC cut-off in the UI.
- **Suggested test:** bucket with high > close; assert the series returns close and that forward-fill uses close.

### P1: important metrics distorted

#### P1-1 · GTC address lists: under-coverage, mislabels, third parties in treasury (N4, A7, A8)

- **Severity:** High (N4) / Medium. **Classification:** incomplete list / methodology. **Effort:** M (data work + review).
- **User impact:** the GTC CEX supply is reported as 17.32M. Counting only the exchange wallets **confirmed by Nansen**, it is about 52.28M. Coinbase Prime custody is not counted as CEX (decision below). The treasury is inflated by 2.75M.
- **Evidence**
  - **Coverage (N4):** the top 100 holders hold 92.57% of supply, but only 36.73% of supply sits in any configured list.
  - **Nansen check** (`verificacao_nansen_cex.md` / `.csv`, 2026-11-09): 107 addresses checked, covering all 29 GTC CEX-list entries, the suspected Upbit/Binance wallets and all 71 unlabelled top-100 holders. Results for the existing labels and suspicions:
    - 32 confirmed;
    - 1 refuted ("Upbit" on `0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13`, which is Bithumb);
    - 3 still uncertain.
  - **Unlabelled holders:**
    - 40 identified as exchanges;
    - 2 identified as Uniswap pools;
    - 1 strong indication;
    - 28 still unlabelled (7.00% of supply).

| Address                                      | GTC        | Nansen                                                                                  | Status / suggestion                                                                                                                                                                                                             |
| -------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0x14d7cee42d4643f0c767a1d504d9ca24c890f86c` | 20,249,871 | entity **Upbit**                                                                        | **confirmed**, add to CEX                                                                                                                                                                                                       |
| `0x41fbba5cb38d22b2d80606406944cedd7c97f6f9` | 4,796,933  | "Binance: Deposit"                                                                      | **confirmed**, add to CEX                                                                                                                                                                                                       |
| `0x2340fc21b654a72dbbaf8ac6d4d3f39ed96c394e` | 1,491,751  | "Binance: Deposit"                                                                      | **confirmed**, add to CEX                                                                                                                                                                                                       |
| `0x8b32ed32cce993a7df8ea6b7d970ef9094fb4c1a` | 757,156    | "Binance: Deposit"                                                                      | **confirmed**, add to CEX                                                                                                                                                                                                       |
| `0x06fd4ba7973a0d39a91734bbc35bc2bcaa99e3b0` | 617,878    | "Binance: Deposit"                                                                      | **confirmed**, add to CEX                                                                                                                                                                                                       |
| `0x4da8853217d0d5b59e8fcde36d1bebb0a1932a14` | 6,039,329  | entity Coinbase Prime (Etherscan: funded by "Coinbase Prime: Custody Deposit Funder 1") | institutional custody: **excluded from CEX** (decision: custody service, not a trading venue)                                                                                                                                   |
| `0x00ebf4f968a507a4404e643eecb35449262861a1` | 1,564,592  | entity Coinbase Prime                                                                   | excluded from CEX, same decision                                                                                                                                                                                                |
| `0x900a248296691385357551cc7d5fae9e256dce8e` | 1,243,247  | entity Coinbase Prime                                                                   | excluded from CEX, same decision                                                                                                                                                                                                |
| `0xe7d8889caa2ef2283f45a5badd3f4e9f1011d6c1` | 504,991    | entity Binance                                                                          | add to CEX                                                                                                                                                                                                                      |
| `0x42c7df3f6bfe02eb61c0c2bd2d73c69eec6023cd` | 1,059,523  | no entity label                                                                         | **uncertain**: probably Upbit. Funded by `0x9913967305d64574bf9a2c4c1f552c8fdb3d4d85` ("Upbit: Main Wallet" in Nansen) and sent 13.27M GTC to `0x14d7cee42d4643f0c767a1d504d9ca24c890f86c` on 2026-10-12. Hold until confirmed. |
| `0x15da7556d5ed888306839bed06f868aeaedcb0d7` | 3,080,448  | only an unofficial "Revolut" tag                                                        | **uncertain**: probably Revolut (Etherscan: funded by "Revolut 3")                                                                                                                                                              |
| `0x00f4a4df8a2db5df0354502803b68365a5c69ddf` | 228,301    | no label                                                                                | **uncertain**: probably a Bithumb withdrawal wallet (funded by "Bithumb: Gas Funder" in Nansen / "Bithumb 42" in Etherscan)                                                                                                     |
| `0xe8f5d1128d4aceed83bd1da259372298b31a028a` | 981,044    | no entity label                                                                         | unlabelled                                                                                                                                                                                                                      |
| `0x3b2a9e6c25163f72f6c879cafdc74f0c8530b758` | 625,000    | no entity label                                                                         | unlabelled                                                                                                                                                                                                                      |
| `0xcc90105d4a2aa067ee768120ada19886021df422` | 565,083    | no entity label                                                                         | contract (ERC1967Proxy), unlabelled                                                                                                                                                                                             |

- Another **31 unlisted top-100 holders are Binance** in Nansen, totalling 6,318,047 GTC. Smaller exchange wallets were also identified: Revolut, Korbit, Kraken, Crypto.com, Bitpanda and one more Coinbase Prime address (`0xceB69F6342eCE283b2F5c9088Ff249B5d0Ae66ea`, also excluded). Full list with complete addresses in `verificacao_nansen_cex.csv`.
- **Classified share of supply after the check:**
  - 36.73% today;
  - **71.69% with the Nansen-confirmed exchanges. This is the figure we use.** Coinbase Prime is excluded;
  - 72.25% adding the two Uniswap pools;
  - 76.61% if the three uncertain wallets are later confirmed.
- **Decision on Coinbase Prime:** the four Coinbase Prime addresses (`0x4Da8853217d0D5B59e8FCDE36D1BeBB0a1932A14`, `0x00eBF4F968A507a4404e643EeCB35449262861A1`, `0x900a248296691385357551cC7D5FAe9E256dce8E`, `0xceB69F6342eCE283b2F5c9088Ff249B5d0Ae66ea`) stay **out** of the exchange (CEX) list, because they are a custody service, not a trading venue.
- **Missing DEX pools:**
  - Uniswap V3 "GTC 3" `0x06B1655b9D560de112759b4F0Bf57d6F005e72Fe` (445,802 GTC; Nansen: Uniswap);
  - Uniswap V2 pair `0xa3509a16bbfc5992eb01cc861b615ccd8e937da8` (Nansen: Uniswap);
  - the Uniswap V4 PoolManager `0x000000000004444c5dc75cB358380D2e3dE08A90`.
- **Mislabels in `apps/indexer/src/lib/constants.ts` (A7):**
  - `0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13` is listed as both "Bithumb" and "Upbit" (lines 550–551). It is Bithumb: Etherscan says "Bithumb 462", and Nansen gives entity Bithumb, "Bithumb: Wallet". The "Upbit" line should go;
  - "Bittavo" should be "Bitvavo" (line 567; Nansen: "Bitvavo: Hot Wallet");
  - the other 27 CEX-list entries are confirmed by Nansen. "Bitpanda" `0x0529ea5885702715e83923c59746ae8734c553b7` only has an unofficial tag, which is consistent with the list.
- **Treasury with third parties (A8):** 2,753,414 of 18,792,276 GTC (14.7%) in the treasury list (lines 291–334) belongs to non-DAO addresses:
  - Arbitrum bridge `0xa3A7B6F88361F48403514059F1F16C8E78d60EeC` (558,011);
  - Optimism bridge `0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1` (453,913);
  - OKX Ventures `0xe527BbDE3654E9ba824f9B72DFF495eEe60fD366` (937,496);
  - Radicle Timelock `0x8dA8f82d2BbDd896822de723F55D6EdF416130ba` (500,000);
  - `0x183a1CaF6750CF88E45812FCE0110D59d71833e4` and `0x11e06eF6e42306dc40D2754Ef2629fB011d80aE9` (150,000 each);
  - `0x7aD3d9819B06E800F8A65f3440D599A23D6A0BDf` (3,994).
- **Suggested fix (done in the PR, commit `88c7a381b`):** add the Nansen-confirmed wallets, keep the three uncertain ones pending, and leave Coinbase Prime out. Five smaller exchange wallets Nansen identified (Revolut `0x9b0c45d46D386cEdD98873168C36efd0DcBa8d46`, Korbit `0xf0bc8FdDB1F358cEf470D63F96aE65B1D7914953`, Kraken `0xcC282E2004428939ee5149A9e7872F0B4d5d5ec7`, Crypto.com `0x5b71D5FD6bb118665582dd87922bF3B9De6c75F9`, Bitpanda `0x74dEc05E5b894b0EfEc69Cdf6316971802A2F9a1`, about 725k GTC) are listed in the PR docs but not added; your call. The full top-100 sheet with Nansen columns is in `listas_gtc.csv`. Remove bridges, investors, individuals and other DAOs from the treasury, and define "treasury" in the glossary.
- **Suggested test:** list lint (see P2-1), plus a monthly top-holder coverage check (reconciler `unlabeled_holder`).

#### P1-2 · Duplicates and category conflicts in other DAOs' lists (A7, N5, N6)

- **Severity:** Medium / Low. **Classification:** incomplete list. **Effort:** S.
- **Evidence** (`apps/indexer/src/lib/constants.ts`):
  - **COMP CEX:** `0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503` listed as "Binance 2" and "Upbit" (594, 600).
  - **ZK CEX:** `0x7aed074ca56f5050d5a2e512ecc5bf7103937d76` listed as "Binance 2" and "BtcTurk" (618, 624).
  - **OP CEX:** `0xE66BAa0B612003AF308D78f066Bbdb9a5e00fF6c` listed as "Coinhako 1" and "Coinhako 2" (527, 528).
  - **SCR DEX:** `0x7761786afAB6E496e6Bf3EBe56fc2ea71cd02d7D` listed as "Honeypop" and "DEX" (691, 692).
  - **COMP treasury:** `0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf` listed as "manUSDbC" and "arbUSDC" (381, 388).
  - **COMP in lending _and_ treasury, so it is counted twice:**
    - `0xc3d688B66703497DAA19211EEdff47f25384cdc3` (762 / 363);
    - `0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840` (763 / 361).
  - **COMP treasury contains L2 Comet markets** (N5): Optimism, Unichain, Polygon, Ronin, Base, Arbitrum, Linea and Scroll, around lines 339–389. They are not meaningful on mainnet.
  - **Burn lists (N6):**
    - `BurningAddresses[AAVE].TokenContract` = `0x000000000000000000000000000000000000dEaD`, expected `0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9`;
    - `BurningAddresses[ARB].TokenContract` = `0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1` (L1 ARB), while the indexed token is `0x912CE59144191C1204E64559FE8253a0e49E6548`.
- **Suggested fix:** dedupe, pick one category per address, and drop non-mainnet entries.
- **Suggested test:** list lint (P2-1).

#### P1-3 · Nouns proposal updates ignored (N16)

- **Severity:** Medium. **Classification:** code bug. **Effort:** M.
- **User impact:** for 53 updated proposals, Anticapture shows the _original_ description and calldata, not the final on-chain version.
- **Evidence**
  - Governor `0x6f3E6272A167e8AcCb32072d08E0957F9c79223d` emitted:
    - 109 `ProposalUpdated`;
    - 80 `ProposalDescriptionUpdated`;
    - 9 `ProposalTransactionsUpdated`.
  - None are handled in `apps/indexer/src/indexer/nouns/governor.ts`.
  - We sampled 12 proposals and all 12 show the original text. For example, proposal 911: the API shows 855 characters, while the final on-chain version is 982.
- **Suggested fix:** handle the three events, updating title, description and targets/values/calldata.
- **Suggested test:** create → update fixture; assert the latest description wins.

#### P1-4 · Fluid: configured timelock differs from the governor's, with a pending admin (N1)

- **Severity:** Medium. **Classification:** configuration. **Effort:** S (config), plus a question for Fluid.
- **Evidence**
  - The dashboard (`apps/dashboard/shared/dao-config/fluid.ts:24`) and the treasury list (`constants.ts:418`, "InstaTimelock") use `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC`.
  - `timelock()` on governor `0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B` returns `0x2386DC45AdDed673317eF068992F19421B481F4c`.
  - `pendingAdmin()` on `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC` is `0x4F6F977aCDD1177DCD81aB83074855EcB9C2D49e`, an Avocado wallet. That could be an in-progress control change.
  - No metric impact today: both timelocks hold 0 FLUID.
- **Suggested fix:** point the config to the governor's timelock and confirm the pending admin with the Fluid team.

#### P1-5 · `/health` reports false "degraded" and cannot tell a real stall apart (A9, part)

- **Severity:** Medium. **Classification:** code bug (monitoring). **Effort:** M.
- **Evidence**
  - `apps/api/src/repositories/health/index.ts:17-23` uses `max(feed_event.timestamp)`, and `apps/api/src/services/health/index.ts:4` uses `FRESHNESS_MAX_LAG_SECONDS = 300`.
  - At review time 6 of 12 DAOs were "degraded" (gtc, nouns, obol, shu, lil_nouns, torn), and only Nouns really was.
  - Lil Nouns proposal 395 shows QUEUED in the API with `queuedTimestamp` 2026-11-09 07:54 BRT, yet `/lil_nouns/health` reported ~16 h of lag.
- **Suggested fix:** compare the last block processed by Ponder (`_ponder_status`) with chain head, and/or each contract's last on-chain log with the last indexed event.

### P2: prevention and quality

#### P2-1 · Indexer has zero tests (A9)

- **Severity:** Medium. **Classification:** process. **Effort:** L (incremental).
- **Test file counts at `89929c8`:**

| App                | Test files |
| ------------------ | ---------- |
| api                | 105        |
| dashboard          | 84         |
| gateful            | 21         |
| relayer            | 12         |
| user-api           | 9          |
| offchain-indexer   | 3          |
| authful            | 1          |
| **indexer**        | **0**      |
| address-enrichment | 0          |

- Every correctness bug above sits in an indexer handler or a quorum client that a small unit test would catch.
- **Suggested tests, in order of value:**
  1. table-driven vote handlers (support 0/1/2, Alpha bool, `VoteCastWithParams`);
  2. ERC-721 mint/transfer/burn;
  3. the Nouns quorum regression (269);
  4. list lint:
     - checksummed addresses;
     - no duplicates;
     - no address in two categories (except burn);
     - API list == indexer list;
  5. "golden data" per DAO at a fixed block (`totalSupply`, list sums, 5 delegates' votes, 3 proposals' votes), checked against an archive RPC in CI.

#### P2-2 · Continuous on-chain reconciliation

- **Severity:** Medium. **Classification:** process/monitoring. **Effort:** L.
- See section 5: a working tool exists at https://github.com/guiriba-code/anticapture-reconciler.

#### P2-3 · Single source of truth for address lists (N7)

- **Severity:** Low. **Classification:** code bug (drift risk). **Effort:** M.
- `TreasuryAddresses` and `NonCirculatingAddresses` are duplicated in `apps/indexer/src/lib/constants.ts:249,867` and `apps/api/src/lib/constants.ts:238,414`.
- The content currently matches but the order differs.
- The ENS token `startBlock` also differs: 13533418 in the indexer vs 9380410 in the API.
- A commented entry, `// ArbitrumL1ERC20Gateway` (`constants.ts:647`, N8), also trips naive parsers.

#### P2-4 · UNI phantom proposals 1–8 (N15)

- **Severity:** Low. **Classification:** code bug / methodology. **Effort:** S.
- Proposals 1–8 of Bravo `0x408ED6354d4973f66138C91495F2f2FCbd8724C3` appear untitled, with 0 votes and NO_QUORUM, although `initialProposalId()` = 8 and `state(1..8)` reverts. Example: proposal 1 from tx `0x52371bf3cc7dc7169203e70e2e914c31408021d38c6b44d8c8652099e2fa5c12`.
- **Suggested fix:** filter `id <= initialProposalId()` for Bravo.

#### P2-5 · `endTimestamp` estimated with a fixed 12 s block (N17)

- **Severity:** Low. **Classification:** methodology. **Effort:** S.
- `apps/indexer/src/eventHandlers/voting.ts:193-210` estimates the end time with a fixed 12 s block, which lands 20–117 min before the real end-block time:
  - COMP: 20–28 min;
  - UNI: 38–48 min;
  - ENS: 29–43 min;
  - Nouns: 36–61 min;
  - GTC: 35–117 min.
- **Fix:** store the real timestamp once `endBlock` is mined, or use a measured average block time.

#### P2-6 · `/token` cached 1 h (N9)

- **Severity:** Low. **Classification:** infra. **Effort:** S.
- `apps/api/src/controllers/token/token-properties.ts:47` calls `setCacheControl(3600)`.
- Observed a 1.04% stale UNI DEX value.
- **Fix:** shorter TTL or `stale-while-revalidate`, and show "as of" in the UI.

#### P2-7 · Documentation / glossary (A10, N19, N18, N12, N10, N11, N21)

- **Severity:** Low / Info. **Classification:** methodology. **Effort:** S.
- **A10:** "Total supply" = `totalSupply()` minus burn lists. Example, UNI: 885,801,322.40 = 1,000,000,000 minus the balances of:
  - `0x000000000000000000000000000000000000dEaD`;
  - the token itself, `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`;
  - `0x090D4613473dEE047c3f2706764f49E0821D256e`.
- **N19:** TORN's treasury vs non-circulating split differs from raw balances by 495,504 TORN in opposite directions:
  - governor `0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce`;
  - vault `0x2F50508a8a3D323B91336FA3eA6ae50E55f32185`;
  - logic in `apps/indexer/src/indexer/torn/erc20.ts:125-185`;
  - circulating is correct.
- **N18:** NO_QUORUM = on-chain Defeated (the contracts do not distinguish them).
- **N12:** "NO BASELINE" shown for long-standing delegates such as `0x00De4B13153673BCAE2616b67bf822500d325Fc3` when no `fromDate` is given (`mappers/voting-power/variations.ts:115`). Unconfirmed whether intended.
- **N10:** AAVE voting-power rounding. The contract stores delegated power with 1e10 scaling, giving differences of less than 7×10⁻⁸ relative.
- **N11:** TORN lock heuristic, documented in `torn/erc20.ts:125-145`:
  - `0x9b4Ee4cB3EE016698aAE8A2c7437ff7E97181C04`: API 23,012.30 vs `lockedBalance` 23,969.02;
  - `0x914d73E3F96948c768443016F3710D0D78dFb20E`: API 950 vs 1,000.
- **N21:** proposal status falls back to the stored status when RPC reads fail (`apps/api/src/clients/governor.base.ts:278`, `:333`). Status could flip between requests; not reproduced.
- **N3:** AAVE has no governance indexed (`/aave/proposals` → 404). Consider stating this in the UI.

### P3: lowest priority

#### P3-1 · Historical coverage of UNI and COMP (N2)

- **Severity:** Medium on paper, but **lowest priority**: it only affects old history. **Classification:** methodology. **Effort:** L if the older governors are indexed; S if only documented.
- **UNI:** GovernorAlpha `0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F` (5 proposals) and `0xC4e172459f1E7939D522503B81AFAaC1014CE6F6` (4) are not covered.
- **COMP:** GovernorAlpha `0xc0dA01a04C3f3E0be433606045bB7017A7323E38` (42) and old Bravo `0xc0Da02939E1441F497fd74F78cE7Decb17B66529` (351) are not covered.
- **Suggested fix:** decide whether that history should be shown; at minimum, say in the UI where coverage starts.

---

## 4. How to reproduce

The review scripts and the raw data they produced are available on request. The scripts are Python and read-only: nothing is written to any external service. With that folder in hand:

```bash
python3 -m venv .venv && .venv/bin/pip install eth-abi eth-utils pycryptodome
# optional, enables Etherscan log queries; only the variable name is referenced in code:
export ETHERSCAN_API_KEY=...   # your own key
```

| Script                                                                          | Area                                                                                                                                                   | Output                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `listas_parse.py`                                                               | parses `apps/indexer/src/lib/constants.ts` (skips comments, keeps line numbers)                                                                        | `dados/listas.json`                                               |
| `a1_cobertura.py`, `a1_eventos.py`                                              | governor/timelock control, unhandled events, old governors                                                                                             | `dados/a1_*.json`                                                 |
| `a3_frescor.py`                                                                 | `/health` vs last on-chain log per DAO                                                                                                                 | `dados/a3_frescor.json`, `dados/a3_nouns_created.json`            |
| `a4_vp.py`                                                                      | voting power sample vs `getVotes`/`getCurrentVotes`                                                                                                    | `dados/a4_vp_amostra.csv`, `dados/a4_vp_resumo.json`              |
| `fetch_props.py`, `a5_propostas.py`                                             | all proposals vs governor `proposalVotes`/`proposals`/`state`                                                                                          | `dados/a5_propostas.csv`, `dados/a5_*.json`                       |
| `a6_metricas.py`, `a6_por_endereco.py`                                          | supply metrics vs on-chain list sums                                                                                                                   | `dados/a6_*.json`                                                 |
| `a7_datas.py`                                                                   | daily series vs on-chain close                                                                                                                         | `dados/a7_gtc_cex_high_vs_close.json`                             |
| `nansen_cex.py`, `nansen_premium.py`, `nansen_consolida.py` (+ `nansen_lib.py`) | Nansen labels for GTC exchange/unlabelled holders (needs `NANSEN_API_KEY`; ~1,850 credits for the full run; responses cached in `dados/nansen_cache/`) | `verificacao_nansen_cex.csv`, `dados/verificacao_nansen_cex.json` |

Run each with `.venv/bin/python <script>.py`. Shared helpers are in `ac_lib.py`:

- API base `https://www.anticapture.com/api/gateful`;
- 0.6 s spacing and backoff;
- response cache in `dados/cache_api/`;
- RPC fallback;
- multicall.

Those cached responses are part of the raw data available on request.

---

## 5. The reconciler

**Repository:** https://github.com/guiriba-code/anticapture-reconciler (public, MIT). It is a read-only tool that compares the public API with the chain for each DAO and emits alerts. It needs no credentials: every default is a public endpoint. Its README covers every check, configuration, outputs, limitations and a production setup.

| Check        | Compares                                                                                                                                     | Alerts                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Lists        | duplicates, address in two categories, commented entries in `constants.ts`                                                                   | `list_duplicate`, `list_category_conflict`, `list_commented_line`                      |
| Governance   | timelock `admin()`/`pendingAdmin()` or `hasRole(PROPOSER_ROLE)` vs the configured governor; `governor.timelock()` vs the configured timelock | `governor_not_indexed` (critical), `governance_migration_pending`, `timelock_mismatch` |
| Freshness    | newest on-chain token/governor log vs the newest activity the API shows (`/health` plus recent proposal created/queued/executed times)       | `indexer_stalled`, `health_false_positive`                                             |
| Supply       | `/{dao}/token` (cache-busted) vs list sums and `totalSupply()`; NFTs vs `totalSupply()`                                                      | `supply_mismatch`, `api_error`                                                         |
| Voting power | top 20 delegates vs `getVotes`/`getCurrentVotes`                                                                                             | `voting_power_mismatch`                                                                |
| Proposals    | the 10 newest proposals' for/against/abstain vs the governor                                                                                 | `proposal_votes_mismatch`                                                              |
| Top holders  | top 50 holders with ≥ 1% of supply and no label                                                                                              | `unlabeled_holder`                                                                     |

**How to run** (from the README):

```bash
git clone https://github.com/guiriba-code/anticapture-reconciler.git
cd anticapture-reconciler
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python -m reconciler                                  # all DAOs, writes ./output/
python -m reconciler --daos gtc,nouns --output out    # selected DAOs
```

Optional settings come from environment variables or a `.env` file: `RPC_URL`, `SCROLL_RPC_URL`, `ANTICAPTURE_API_URL` and `ANTICAPTURE_CONSTANTS_URL` / `_PATH`. See `.env.example`.

**Outputs:** `alerts.json`, `alerts.md` and `metrics.prom` (Prometheus textfile format).

**Latest run:** `examples/latest-run/` in the repo, 2026-11-09 12:19 BRT, all 10 DAOs in about 2 minutes, **88 alerts**:

- 1 critical: A3, the GTC governor;
- 12 high: A4 and A5 (Nouns), A1 (6 GTC proposals), N14 (Scroll), N1 (Fluid), and the `/lil_nouns/token` 500;
- 69 medium: list duplicates and conflicts, the Fluid timelock mismatch and 62 large unlabelled holders;
- 5 low: quiet DAOs that `/health` calls "degraded";
- 1 info.

A clean-clone test ran the same day at about 12:35 BRT and gave 89 alerts. The extra one was another low `health_false_positive`, on ENS.

**Changes from the review prototype**

- Everything is now in English.
- Config comes from environment variables with public defaults, and the address lists are downloaded from `blockful/anticapture` `dev`.
- Unit tests and a CI workflow were added. The CI and opt-in hourly GitHub Actions workflows are in `ci/workflows/` until they are moved into `.github/workflows/`.
- **Fixed:** the Lil Nouns false "stalled" alert. Freshness now also uses proposal timestamps, so a `ProposalQueued` that the API already shows no longer looks like a lag.

**Known limitations**

- No AAVE, TORN or SHU proposal checks.
- Only the last 10 proposals and the top 20 delegates per DAO are compared.
- The API and the chain are not read at the same block.
- The contract map mirrors Anticapture's configuration and must be updated with it.

**Suggested production shape** (detailed in the README)

- an hourly run with your RPC;
- `metrics.prom` into Prometheus;
- Alertmanager rules: critical for `governor_not_indexed`; high for `indexer_stalled` and for vote or voting-power mismatches;
- a "reconciler not running" rule;
- a real-time watcher on `NewAdmin`, `NewPendingAdmin`, `RoleGranted` and `TimelockChange`.

---

## 6. Gaps and open questions for the team

**What we could not verify**

- Root causes needing private logs or the database (Railway / Loki / Grafana / Postgres).
- Not checked:
  - DELEGATED_SUPPLY vs the sum of all delegates;
  - historical voting power;
  - `delegationsCount`;
  - SHU (Azorius) proposals on-chain;
  - Snapshot;
  - attack-cost formulas and prices;
  - the relayer;
  - finality/reorg settings;
  - dashboard UI vs API (no screenshots taken);
  - Kubb SDK vs OpenAPI.
- Supply metrics were recomputed at the latest block only (except the GTC CEX series).
- Top-holder labelling was done only for GTC. Labels come from Nansen (plus public Etherscan); a third-party label is strong evidence, not proof of ownership. 28 GTC top-100 holders (7.00% of supply) remain unlabelled.

**Questions**

1. **Nouns stall (A4):** what do the indexer logs show around 2026-10-19 13:49 BRT? Did the Ponder sync keep advancing (a handler error) or stop (an RPC/infra issue)? Did `IndexerSyncStale` fire?
2. **`/lil_nouns/token` 500 (A5):** the likely cause was found while preparing the PR: nothing wrote the Lil Nouns `token_price` table, and `getTokenPrice()` threw on an empty table. Can you confirm from the API logs that this was the error?
3. **GTC Governor (A3) and replays:** were you already aware of the migration to `0xef41CbD211076E8b1901e214Bf751d404cf06638`? When could the GTC replay (from block `12422079`) and the other replays listed in section 0 be scheduled?
4. **Methodology decisions:**
   - Should bridges count as treasury or circulating?
   - What is your preferred source for exchange labels?
   - Lowest priority: should the old UNI/COMP governors be covered?
5. **Fluid:** could someone with a Fluid contact ask them whether the pending admin `0x4F6F977aCDD1177DCD81aB83074855EcB9C2D49e` on the old timelock `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC` is expected?
6. **Reconciler:** would you prefer it as a scheduled job in your infra, or as checks inside the indexer/API (e.g. a `/reconcile` endpoint)?

---

_Detailed area reports in Portuguese, with all supporting data:_

- `01_cobertura_contratos.md` … `09_testes_monitoramento.md`;
- `RESUMO.md`;
- `listas_gtc.csv`, `verificacao_nansen_cex.md` / `.csv`;
- `dados/`.
