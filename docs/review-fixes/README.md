# External review fixes

Fixes for the read-only review of `dev` at `89929c879` (9 Nov 2026). Each code change is one commit. Re-index notes are decisions for the upstream team: this branch does not replay chain data or ship a migration.

## Status

| ID  | Title                                                               | Severity    | Status                                           | Commit                            | Files                                                                                                                         | Test                                                                          |
| --- | ------------------------------------------------------------------- | ----------- | ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A1  | GTC/ZK abstain stored as for                                        | High        | fixed                                            | `2c38c247f`                       | `apps/indexer/src/indexer/gtc/governor.ts`, `apps/indexer/src/indexer/zk/governor.ts`, `apps/indexer/src/lib/vote-support.ts` | `vote-support.unit.test.ts`                                                   |
| A2  | GTC GovernorAlpha `VoteCast` not indexed                            | High        | fixed, needs re-index                            | `0519c7c59`                       | `apps/indexer/src/indexer/gtc/abi/governor.ts`, `apps/indexer/src/indexer/gtc/governor.ts`                                    | `governor-vote.unit.test.ts`                                                  |
| A3  | Gitcoin Governor Charlie not indexed; dashboard still targets Bravo | Critical    | fixed; Charlie backfill is bounded               | `0f7892306`                       | indexer GTC config and handler, API constants, `dashboard/shared/dao-config/gtc.ts`                                           | `gtc-governor.unit.test.ts`                                                   |
| A4  | Nouns indexer host stalled since 19 Oct 2026                        | High        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| A5  | NFT burns ignored; `GET /lil_nouns/token` 500                       | High        | fixed; historical supply needs re-index          | `af1a5ef59`, `b4b7f7d86`          | Nouns and Lil Nouns token/governor, NFT price service                                                                         | `nft-supply.unit.test.ts`, `nft.unit.test.ts`, `nft-price/index.unit.test.ts` |
| A6  | Daily series uses high, not close                                   | High        | fixed, no re-index                               | `45ed31deb`                       | token-metrics service, mapper, dashboard chart readers                                                                        | `token-metrics/index.unit.test.ts`                                            |
| A7  | Duplicate CEX/DEX labels                                            | Medium–High | fixed                                            | `4a157ed03`, `88c7a381b`          | `apps/indexer/src/lib/constants.ts`                                                                                           | `address-lists.unit.test.ts`                                                  |
| A8  | GTC treasury includes third parties                                 | Medium      | fixed, needs re-index                            | `962214beb`                       | indexer and API `constants.ts`                                                                                                | `address-lists.unit.test.ts`                                                  |
| A9  | `/health` false stalls; indexer had no tests                        | Medium      | fixed                                            | `2c38c247f` (runner), `3d4ea85fc` | health service and repository                                                                                                 | `freshness.unit.test.ts`, `health/index.unit.test.ts`                         |
| A10 | Total supply subtracts burn balances                                | Low         | documented-only                                  | —                                 | glossary below                                                                                                                | —                                                                             |
| N1  | Fluid timelock is not `governor.timelock()`                         | Medium      | fixed                                            | `7618feab6`                       | Fluid dao-config and both treasury lists                                                                                      | `address-lists.unit.test.ts`                                                  |
| N2  | Old UNI and COMP governors not indexed                              | Medium      | documented-only (lowest priority)                | —                                 | —                                                                                                                             | —                                                                             |
| N3  | AAVE has no governor                                                | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N4  | GTC exchange labels                                                 | High        | fixed for Nansen-confirmed wallets; rest pending | `88c7a381b`                       | `apps/indexer/src/lib/constants.ts`                                                                                           | `address-lists.unit.test.ts`                                                  |
| N5  | COMP treasury lists L2 markets and lending twice                    | Low         | fixed, needs re-index                            | `cc15983ee`                       | indexer and API `constants.ts`                                                                                                | `address-lists.unit.test.ts`                                                  |
| N6  | AAVE and ARB burn `TokenContract` wrong                             | Low         | fixed, needs re-index                            | `8a0c779b4`                       | `BurningAddresses`                                                                                                            | `address-lists.unit.test.ts`                                                  |
| N7  | Treasury lists copied in two packages                               | Low         | guard added, not unified                         | `5ce431878`                       | `address-list-parity.unit.test.ts`                                                                                            | that file                                                                     |
| N8  | Commented UNI DEX line                                              | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N9  | `/token` cached for 1 hour                                          | Low         | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N10 | AAVE voting power rounding                                          | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N11 | TORN lock heuristic                                                 | Low         | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N12 | `NO BASELINE` variation label                                       | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N13 | Nouns/Lil Nouns quorum counts abstain and uses the latest quorum    | High        | fixed, no re-index                               | `e33d8b06f`                       | `apps/api/src/clients/nouns/index.ts`                                                                                         | `clients/nouns/index.unit.test.ts`                                            |
| N14 | SCR (and OP) `VoteCastWithParams` ignored                           | High        | fixed; SCR history needs re-index                | `017d6c675`                       | `scr/governor.ts`, `op/governor.ts`                                                                                           | `vote-cast-with-params.unit.test.ts`                                          |
| N15 | UNI proposals 1–8 are invalid on-chain                              | Low         | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N16 | Nouns proposal edits ignored                                        | Medium      | fixed, needs re-index                            | `dacee888e`                       | nouns and lil-nouns governors, `proposal-content.ts`                                                                          | `proposal-content.unit.test.ts`                                               |
| N17 | `endTimestamp` estimated with a 12s block                           | Low         | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N18 | API `NO_QUORUM` vs on-chain `Defeated`                              | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N19 | TORN treasury vs vault split                                        | Low         | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |
| N21 | Proposal status falls back when RPC fails                           | Info        | documented-only                                  | —                                 | —                                                                                                                             | —                                                                             |

N20 is the same Fluid timelock as N1.

## Re-index and migration

Nothing here deletes rows or runs a migration. Ponder applies handler changes to **new** logs only, unless the team replays from the stated block.

| Change                    | What a replay must cover                                                  | Safe to ship before replay?                                                                                        |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A1 abstain mapping        | GTC from Bravo start `17813942`; ZK only if that indexer is ever deployed | New votes are correct. Historical abstain stays inside `for` until replay.                                         |
| A2 Alpha `VoteCast`       | GTC from Alpha start `12497481`                                           | The ABI change can make Ponder rescan GTC. Schedule that. Do not treat it as automatic.                            |
| A3 Governor Charlie       | New contract only, from `25776742`                                        | Yes for the dashboard target. Charlie proposals appear after that backfill. Existing Bravo rows are not rewritten. |
| A5 NFT burns              | Nouns from `12985438`, Lil Nouns from `14736710`                          | New burns subtract. The 26 Nouns and 761 Lil Nouns already burned stay in supply until replay.                     |
| A5 Lil Nouns auctions     | Auction house from `14736713`                                             | The 500 is fixed without this. Prices stay a degraded `0` until the auction backfill.                              |
| A8, N5, N6, N4 lists      | The affected DAO from its token start                                     | Stored supply does not move until replay. GTC `CEX_SUPPLY` stays on the old list until a GTC replay.               |
| N14 SCR                   | Scroll governor from `8963441`                                            | New module votes are stored. The treasury RFP stays at 0 for until replay. OP is not in production.                |
| N16 proposal edits        | Nouns governor from `12985453`                                            | New edits apply. The 53 already edited proposals keep the original text until replay.                              |
| A6, N13, A9, N1 dashboard | none                                                                      | Yes.                                                                                                               |

A4 is a stopped Nouns indexer process. Replaying code will not move a process that is not running.

## A1 — abstain counted as for

**Problem.** `support ? 1 : 0` maps Bravo abstain (`2`) to for (`1`).

**User impact.** 20 of 49 GTC Bravo proposals hid 6,844,777.25 GTC of abstain inside for. ZK has the same handler and is not in production. No proposal status flipped, because that governor's quorum is `for,abstain`.

**Evidence.** `apps/indexer/src/indexer/gtc/governor.ts` (previously line 19) and `zk/governor.ts` (previously line 20). On-chain `for` plus abstain matched the API `for`, and API abstain was 0.

**Root cause.** `uint8` support was coerced as a boolean. `voteCast` already buckets `0`, `1` and `2` correctly.

**Change.** `bravoSupport()` returns `Number(support)`.

**Test.** `bravoSupport(2)` is `2`.

**Risk.** Replay rewrites historical GTC vote rows. Until then the API still shows the old totals.

## A2 — GovernorAlpha votes

**Problem.** Alpha `VoteCast(address,uint256,bool,uint256)` was not in the ABI. 5,036 votes were dropped. Proposal 66 is `Succeeded` on-chain and `NO_QUORUM` in the API. The other 10 `NO_QUORUM` Alpha proposals are `Defeated` on-chain with for-votes under 2.5M, so their status matched by coincidence.

**Evidence.** Alpha `0xDbD27635A534A3d3169Ef0498beB56Fb9c937489`. Verified ABI: `voter` is **not** indexed. Weight field name is `votes`.

**Change.** The ABI declares that event. The handler maps `true` to for and `false` to against, and the Bravo handler uses its full signature so the two events are not both consumed.

**Test.** The ABI contains `VoteCast` with input types `address, uint256, bool, uint256` and `voter.indexed === false`.

**Risk.** Needs the GTC replay above. Do not start it casually: it reprocesses Alpha and Bravo logs.

## A3 — Governor Charlie

**Problem.** Timelock `0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518` admin is `0xef41CbD211076E8b1901e214Bf751d404cf06638` (`GitcoinGovernorWithGuardian`, "Gitcoin Governor Charlie"). The indexer and the propose/vote buttons still used Bravo `0x9D4C63565D5618310271bF3F3c01b2954C1D1639`.

**Evidence.** Blockscout: deployed in block `25776742` (17 Aug 2026). `COUNTING_MODE` is fractional. `proposalGuardian()` is `0x5743e35477363241300fcedc2f5eb0195f300817`. `lateQuorumVoteExtension()` is 7,200 blocks. `votingDelay()` is 14,400 blocks. `votingPeriod()` is 40,320 blocks. `proposalThreshold()` is 150,000 GTC. No `ProposalCreated` yet. `ProposalCreated` uses the same type tuple as Bravo (`voteStart`/`voteEnd` decode as `startBlock`/`endBlock`). `VoteCast` and `VoteCastWithParams` match the existing OZ events.

**Change.** Charlie is its own Ponder contract from block `25776742`, so the Bravo address set is unchanged. Both contracts record `VoteCast` and `VoteCastWithParams`. Fractional support `255` decodes `abi.encodePacked(uint128 against, uint128 for, uint128 abstain)` into the three counters. A malformed payload adds nothing and does not throw. `COUNTING_MODE` is `support=bravo,fractional&params=fractional`, so one voter can cast several partial votes on one proposal. `votes_onchain` has a single row per `(voter, proposal)`. A second insert would throw and stall the GTC indexer. The second ballot adds its weight to `votingPower`, does not increment `accountPower.votesCount` again, and still adds the decoded split to the proposal totals. The same log seen again is ignored. The dashboard governor is Charlie. Voting delay, late-quorum extension and the guardian address are in the governance copy. The signer threshold of the guardian Safe was not read (public RPCs refused the call), so no Security Council card was invented.

**API status client.** It still calls Bravo. Charlie has no proposals. Pointing `quorum(block)` at Charlie would recompute finished Bravo proposals against a different quorum. Route per governor when the first Charlie proposal exists.

**Test.** Constants and `gitcoin.config.ts` name Charlie and block `25776742`. Fractional decode is in `vote-support.unit.test.ts`.

**Risk.** Ponder backfills Charlie from `25776742` on deploy. That is new logs only.

## A4 — Nouns indexer stopped

**Not a code change.** `/nouns/health` last event is 19 Oct 2026 16:49 UTC. Chain `NounCreated` continued through ids 2052–2068. The API process still answers. Logs, Railway and Postgres were not available, so the stuck handler versus stuck sync cannot be told apart from here. Restart or inspect that host. The burn fix in A5 does not catch the indexer up.

## A5 — NFT burns and `/lil_nouns/token`

**Problem.** `NounCreated` adds 1 to total and delegated supply. `Transfer` to `0x0` did not subtract. Nouns API supply 2052 vs `totalSupply()` 2043 (26 burns). Lil Nouns series 8450 vs `totalSupply()` 7689 (761 burns). `GET /lil_nouns/token` returned 500.

**Root cause of the 500.** Nothing writes Lil Nouns `token_price`. `getTokenPrice()` used a non-null assertion on an empty table and threw. Nouns writes prices from `AuctionSettled`; Lil Nouns had no auction contract.

**Change.** A burn (`to` is `0x0` or `0xdead`, and `from` is not `0x0`) decreases total and delegated supply and refreshes circulating. Mints stay on `NounCreated`, so they are not counted twice. Empty auction prices return `{ data: "0", degraded: true }` instead of throwing. Lil Nouns auction `0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E` (deployment block `14736713`, Blockscout name `NounsAuctionHouseProxy`) is indexed. Same-day settlements update the row instead of failing the insert, because Lil Nouns settles many times a day and a thrown insert would stall the indexer.

**Test.** `isNftBurnTransfer` distinguishes mint, burn and ordinary transfer. Repository returns null on an empty price table. Service returns a degraded zero.

**Risk.** Historical supply is wrong until Nouns and Lil Nouns are replayed. The auction backfill from block 14,736,713 is large and should be scheduled. The 500 fix does not need it.

## A6 — daily close

**Problem.** `dao_metrics_day_buckets.close` is the last value of the UTC day. The API charted `high` and forward-filled `high`. The 12 Oct 2026 GTC CEX drop (close 30.34M, high 41.53M) and the 29 Oct Binance-hack drop (close 18.71M, high 33.23M) showed up a day late, and quiet days kept the pre-drop high forever.

**Change.** The series forward-fills `close`. The response adds `close` and `partial` (true on the current UTC day). `high` stays the observed high on event days and the carried close on gap days. Dashboard chart, vote turnout and attack-profitability reads prefer `close`.

**Test.** A day with high 41,534,595 and close 30,339,646 is followed by a gap day at 30,339,646, not the high.

**Risk.** None for storage. This changes the gateway contract: `close` and `partial` are new fields, and `high` on a gap day is the carried close rather than the previous peak. `@anticapture/gateful` has a changeset for that. Clients that plotted `high` and want the peak must read `high` on event days only. The chart level is `close`. Regenerate `@anticapture/client` from the updated Gateful spec. The dashboard helper reads `close` when the JSON has it.

## A7 — duplicate labels

**Change.** Removed the second label where one address was stored twice: COMP CEX `Upbit` (same address as `Binance 2`, `0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503`, the Binance peg wallet also listed for UNI), ZK CEX `BtcTurk` (same address as `Binance 2`), OP CEX `Coinhako 2`, SCR DEX `DEX` (same address as `Honeypop`). The supply set already deduped, so totals do not change. The kept label is the first one; confirm ZK `0x7aed074ca56f5050d5a2e512ecc5bf7103937d76` before calling it Binance in the UI.

**GTC.** The Bithumb/Upbit double label and the Bitvavo typo are corrected in N4, using Nansen. The duplicate test now includes GTC.

## A8 — GTC treasury

**Change.** Removed bridges, OKX Ventures, Protocol Labs, Matt Solomon, Radicle Timelock, deltajuliet.eth and the ten "Old Address, Large GTC Transfers" entries from both treasury lists. Gitcoin timelock, CSDO, grants, vesting and staking stay.

**Impact.** About 2.75M GTC stops counting as treasury and circulating rises by the same amount, after re-index. Bridges hold user tokens and should be circulating.

**Risk.** Vesting addresses were left in treasury. If some of those are investor locks, they belong in non-circulating instead. That split was not in the measured third-party set.

## A9 — health

**Problem.** `lastEventTimestamp` was `max(feed_event.timestamp)` and fresh meant "within 300 seconds of the wall clock". Six of twelve DAOs looked degraded. Only Nouns was actually behind. Lil Nouns had a queued proposal the feed did not reflect.

**Change.** Activity is the max of feed, votes, proposal created/queued/executed, transfers and metric `last_update`. If `ponder_sync.blocks` is readable, freshness is that sync timestamp within 600 seconds (the existing `IndexerSyncStale` alert). If the schema is missing, freshness is activity within 24 hours, so a quiet afternoon is not a stall and a 468 hour Nouns gap still is. A failed sync query is unknown, not degraded by itself.

**Test.** Five quiet minutes stay fresh. A day-plus without a cursor does not. A stale sync cursor does not, even if a feed row is new. A vote newer than the feed wins. Missing `ponder_sync` returns null.

**Not done.** Comparing the cursor to the last real contract log needs an RPC `eth_getLogs` in the request path. That belongs in the reconciler, not in `/health`.

## N1 — Fluid timelock

**Change.** Dashboard and both treasury lists use `0x2386DC45AdDed673317eF068992F19421B481F4c`, which is `governor.timelock()`. The old `0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC` remains only in a comment.

**Still open.** That old timelock's `pendingAdmin` is `0x4F6F977aCDD1177DCD81aB83074855EcB9C2D49e`. Both contracts held 0 FLUID at review time, so supply does not move. Someone who knows the Fluid migration should say whether the pending admin is expected.

## N13 — Nouns quorum

**Problem.** `calculateQuorum` added abstain. `getQuorum` called `quorumVotes(proposalCount)` and cached that number for every proposal. Nouns 269 is 101 for, 78 against, 57 abstain, quorum 135, on-chain `Defeated`. The API summed 158 against the latest quorum (136) and said `SUCCEEDED`. 16 Nouns and 12 Lil Nouns proposals were wrong. Both DAOs share this client.

**Change.** Quorum votes are `forVotes` only. `quorumVotes(proposalId)` is cached per id.

**Test.** Nouns 269 becomes `NO_QUORUM` (the API name for on-chain defeated-without-quorum; see N18) and the client does not call `proposalCount`.

**Risk.** None for storage. Status changes on the next request.

## N14 — `VoteCastWithParams`

**Problem.** Scroll `COUNTING_MODE` includes modules. "DAO Treasury Management RFP" had 1,806,873.99 SCR for via `VoteCastWithParams` and was API `NO_QUORUM` / on-chain `Succeeded`. OP has the same handler and is not in production.

**Change.** SCR and OP record `VoteCastWithParams` the same way as `VoteCast`.

**Risk.** SCR history needs a replay. OP can backfill on first deploy.

## N16 — Nouns proposal edits

**Problem.** 109 `ProposalUpdated`, 80 `ProposalDescriptionUpdated` and 9 `ProposalTransactionsUpdated` were ignored. Checked descriptions were the original text.

**Change.** Those events update description, title (re-parsed from the H1) and/or targets, values, signatures and calldata. Untouched fields stay. Lil Nouns registers the same events because it uses the Nouns ABI.

**Test.** A description edit retitles and keeps calldata. A transaction edit keeps the description.

**Risk.** The 53 already edited proposals stay stale until a Nouns replay.

## N4 — GTC exchange labels

Source: Nansen profiler labels and premium labels, checked 9 Nov 2026. Etherscan nametags were only a cross-check. A Nansen label is strong evidence, not proof of ownership.

**Added or corrected**

- `0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13` stays **Bithumb**. Nansen entity Bithumb, name "Bithumb: Wallet". The second label "Upbit" on this address was removed.
- `0x14D7Cee42D4643f0C767A1D504d9cA24C890f86c` added as **Upbit**. Nansen entity Upbit.
- `0xeDAe8A6cBA6867a0B7e565C21eaBAEe3D550fd9d` was already **Upbit 2**. Nansen entity Upbit. Left in place.
- Binance deposits, Nansen name "Binance: Deposit": `0x41fbBa5CB38D22B2D80606406944cEdd7c97f6F9`, `0x2340Fc21b654a72DBBAF8aC6D4d3F39ed96C394E`, `0x8B32ED32cCE993a7Df8ea6b7D970Ef9094Fb4C1A`, `0x06FD4bA7973a0d39a91734bbc35bC2bCaa99E3B0`.
- 31 more top holders whose Nansen entity is Binance, labeled `Binance 6` through `Binance 36` (those numbers are local, not Binance's own names): `0xe7d8889CAa2Ef2283F45a5BADd3f4e9F1011d6c1`, `0x3f2cACcF5d7729D7580fd833DBC5915b776Ac3D3`, `0x1c09c28aF3D6CbC12CE4759C4c34B7F47bdFcB52`, `0x5D424fB3180699ee29fc77A346FcDC2a01917331`, `0xDFe8C48608DB1dC34e057916dcb3deea0B7BFbF5`, `0x19781A65D1C01DF413C06037Cf95700D6dE5eD70`, `0xc298F83AB80e4931cCB5aC2EaC3c829FA8bECf91`, `0xc7166512AF1ef0031615ed05f4e9691a29F22ad9`, `0x0838E9FF32c64A2444013b5f75180A3dC79600C2`, `0xF864F0b0faa88601594942d815aCf52A9953f518`, `0xadF0e827b07F07508FDC5Cf9C3F28d29d976F0f2`, `0x44926E4E0fF5C795a7c09E1E441e29f51F1Ec392`, `0x6C922e70730EC2680a192964e80fA84E16AE29d8`, `0x29984d1F9055cafB02dcDd53C54B727902E44975`, `0xC664Ee601FFB6501cb85fCb5B78D186E0CBAF854`, `0x0F3AB53D6f1ecd6D1231675fFbF28D9Dc85af4FB`, `0xa235368bD1861f0935dea15948d26BA710a3DaF0`, `0xf03eFfB80EB3Cb15f76EE0D0a62661E95d603ca8`, `0x4b677896083c94D56d7890E3E3BF702D25952881`, `0xc2709D7EB85c6aDc4df07A2e6EBB3f9ad0ab814a`, `0xDDCd71B4636244347a203F72A93581eA0e3f43D9`, `0x112C5698e6CE9ab30Ad4654dE9005C2481f3E333`, `0x32dAa5F850A63C4fC1a86B07855346B2Bad81631`, `0x1EDeEb612c77FBE027331360fc8a19e3565edbA8`, `0x628b5bd3BC2c6F48cca02013Fb76045051BE8474`, `0x0Dc1F806f5692Ca91BC8b3463ebdc12d07F083d9`, `0x21B23261F1D117e50ac2E16E3252EDFA92b45e71`, `0xe294C1455555Fd83703E734B4ED90d619653c983`, `0x6dFc373cE84E762D75c4c68b83436De0AF707987`, `0x3871F760B6076A44A4058b1a8e5138a44205f784`, `0x150819f32b6e5957b4116ec8Df419e50b15bB679`.
- `0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC` was already listed. Nansen entity Bitvavo, name "Bitvavo: Hot Wallet". The label was corrected from "Bittavo".

**Pending, not added**

- `0x42C7DF3f6BFe02EB61c0C2Bd2d73C69eeC6023cd` — no Nansen entity. Funded by a wallet Nansen calls "Upbit: Main Wallet", and it sent GTC to the confirmed Upbit wallet. Uncertain.
- `0x15Da7556D5ED888306839bed06f868AeaeDCb0d7` — unofficial "Revolut" tag only. Funded by `0x9b0c45d46D386ceDd98873168c36efd0Dcba8d46`, which Nansen does call Revolut. Uncertain.
- `0x00f4a4DF8a2dB5Df0354502803B68365a5c69dDf` — no direct label. Funded by a Nansen "Bithumb: Gas Funder". Uncertain.
- `0x0529ea5885702715e83923c59746ae8734c553B7` — already labeled Bitpanda. Nansen only has an unofficial Bitpanda tag. Left as it was. Not removed.
- Coinbase Prime custody, pending a methodology decision (client assets held by Coinbase, not necessarily an exchange hot wallet): `0x4Da8853217d0D5B59e8FCDE36D1BeBB0a1932A14`, `0x00eBF4F968A507a4404e643EeCB35449262861A1`, `0x900a248296691385357551cC7D5FAe9E256dce8E`, `0xceB69F6342eCE283b2F5c9088Ff249B5d0Ae66ea`.

**Re-index.** GTC from token start `12422079` before `CEX_SUPPLY` includes the new balances. New transfers after deploy use the new list immediately; the stored total does not jump until replay.

## N5, N6, N7

N5 drops L2 Comet markets from the COMP treasury (the indexer reads mainnet) and removes mainnet USDT `0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840` and USDC `0xc3d688B66703497DAA19211EEdff47f25384cdc3` from treasury because they are already the lending list. `manUSDbC` and `arbUSDC` were the same address and left with the L2 block. Lending still counts those two mainnet markets. Re-index before the COMP treasury number changes.

N6 sets AAVE `TokenContract` to `0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9` and ARB `TokenContract` to `0x912CE59144191C1204E64559FE8253a0e49E6548` (the indexed token, not the L1 token). Re-index before supply changes. ARB is not in production.

N7 does not add a shared package. `TreasuryAddresses` now has a test that the API and indexer address sets match. `NonCirculatingAddresses` matches except TORN governor `0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce`, which the API uses to hide the governor from holder listings and the indexer treats under the TORN supply rule (N19). Collapsing the copies into one package is a team decision.

## Not changed

| ID  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A4  | The Nouns process is stopped. No code path in this repo restarts it.                                                                                                                                                                                                                                                                                                                                                                    |
| A10 | Methodology. See the glossary. The arithmetic already matches the lists.                                                                                                                                                                                                                                                                                                                                                                |
| N2  | Lowest priority, and it is a coverage decision. UNI GovernorAlpha `0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F` (5 proposals) and `0xC4e172459f1E7939D522503B81AFAaC1014CE6F6` (4) are absent. COMP GovernorAlpha `0xc0dA01a04C3f3E0be433606045bB7017A7323E38` (42) and old Bravo `0xc0Da02939E1441F497fd74F78cE7Decb17B66529` (351) are absent. Indexing them changes participation history. Do it only if the team wants that history. |
| N3  | AAVE governance is not indexed. `/aave/proposals` is 404 on purpose today. Adding a governor is a product decision. `blockTime: 1` is unused without one.                                                                                                                                                                                                                                                                               |
| N4  | Confirmed Nansen wallets are in the GTC CEX list. Pending addresses are listed in the N4 section and were not added.                                                                                                                                                                                                                                                                                                                    |
| N8  | The commented UNI `ArbitrumL1ERC20Gateway` line is intentional.                                                                                                                                                                                                                                                                                                                                                                         |
| N9  | `GET /token` uses `cache-control: public, max-age=3600` on purpose. A one-hour public cache is an infra/product choice, not a wrong total.                                                                                                                                                                                                                                                                                              |
| N10 | AAVE power is stored with more precision than the contract's 1e10 scale. Differences were under 1.4e-6 AAVE.                                                                                                                                                                                                                                                                                                                            |
| N11 | TORN ignores some locks when the counterparty is not the transaction sender. The code already documents that. Two sampled accounts differ. Changing it is a methodology decision.                                                                                                                                                                                                                                                       |
| N12 | `NO BASELINE` is what the API returns when the value before the window is zero. Not confirmed as a defect.                                                                                                                                                                                                                                                                                                                              |
| N15 | UNI Governor Bravo ids 1–8 revert in `state()` because `initialProposalId()` is 8. Hiding them in the shared proposals query would also hide fixture ids, because tests default `DAO_ID` to UNI and use ids `"1"` and `"2"`. A safe filter needs a governor column. Left for that design.                                                                                                                                               |
| N17 | `endTimestamp` is `timestamp + (endBlock - block) * blockTime` with a fixed 12 second block. Measured early by 20–117 minutes. Active status uses the block and is right. Replacing the estimate needs a chosen block-time source.                                                                                                                                                                                                      |
| N18 | API `NO_QUORUM` is on-chain `Defeated` when for-votes miss quorum. The contracts do not have a separate state. Renaming is a product decision. N13 now returns `NO_QUORUM` for Nouns 269, which matches this convention.                                                                                                                                                                                                                |
| N19 | TORN treasury and non-circulating differ from raw governor and vault balances by 495,504 TORN in opposite directions. Circulating still matches. The indexer ignores lock, unlock and governor/vault migration in `apps/indexer/src/indexer/torn/erc20.ts`. Document the rule; do not change it without a decision.                                                                                                                     |
| N21 | If the status RPC fails, the API returns the indexed status (`governor.base.ts`). That is a fallback, not a wrong formula. It was not reproduced.                                                                                                                                                                                                                                                                                       |

## Glossary

These definitions match the code. They are not yet on the public site.

| Metric              | Definition                                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total supply        | `totalSupply()` minus balances of the burn list (`0x0`, `0xdead`, the token contract, and the UNI unclaimed-airdrop address where configured). The contract's raw `totalSupply()` is larger. |
| Treasury            | Governance-controlled contracts only: timelock, DAO safes, DAO vesting. Not bridges, investors, people or another DAO's timelock.                                                            |
| Non-circulating     | Third-party vesting and locks that cannot vote or sell now.                                                                                                                                  |
| Circulating         | Total supply minus treasury minus non-circulating. CEX, DEX and lending are not subtracted.                                                                                                  |
| CEX / DEX / lending | Sum of `balanceOf` on the lists. GTC additions are Nansen-confirmed exchange wallets only. Coinbase Prime and the uncertain wallets in the N4 section are not included.                      |
| Delegated           | Sum of delegate voting power. For Nouns and Lil Nouns, after A5 and a replay, this is mints minus burns.                                                                                     |
| Daily series        | UTC close (`00:00` to `24:00` UTC). The current day is `partial: true`.                                                                                                                      |
| TORN treasury       | Does not follow raw governor and vault balances. Locks that the indexer cannot attribute stay in the original bucket. Circulating is unchanged. See N19.                                     |
| Historical coverage | UNI and COMP charts start at the current governor, not at the Alpha governors. See N2.                                                                                                       |
| `endTimestamp`      | Estimated until the end block is observed. It can be early by about 20–120 minutes. Status `ACTIVE` uses the block.                                                                          |
| `/token` cache      | Public `max-age=3600`.                                                                                                                                                                       |

## Indexer tests

`apps/indexer` had no test script. It now runs Vitest (`pnpm --filter @anticapture/indexer test`) on `src/**/*.unit.test.ts`. The runner was added in the A1 commit. Ponder handlers are not booted; tests cover the pure decisions and the ABI.
