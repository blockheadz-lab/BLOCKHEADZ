# BLOCK SHARE

BLOCKHEADZ uses a 5% creator **royalty enforced on OpenSea**. The royalty payout is routed directly into the BlockShare smart contract instead of a team wallet.

When the pot hits the threshold, anyone can trigger a draw (once per 24 hours). Chainlink VRF picks **3 random** BLOCKHEADZ token slots. The current holders of those tokens can claim their ETH.

We get nothing from the BlockShare pot.

## How it works

```
OpenSea secondary sale
        │
        │  5% creator royalty (0.5% to VRF reserve, 99.5% to pot)
        ▼
BlockShare.sol  pot builds up here
        │
        │  pot >= 0.04 ETH?
        ▼
requestRound()  anyone can call this (max once per 24hr)
        │
        │  Chainlink VRF v2.5
        ▼
3 random token slots selected
        │
        └── current holders call claim() and ETH is sent to wallet
```

The royalty receiver just accepts ETH. It does not try to trigger a draw at the same time. That is a separate step once the pot is ready. Royalties can land cleanly regardless of what is happening with Chainlink.

## Numbers

| | |
|---|---|
| Creator royalty | 5% |
| Royalty recipient | BlockShare contract |
| Team cut | 0% |
| Draw threshold | 0.04 ETH |
| Winners per draw | 3 |
| Split | Equal thirds, dust goes to first winner |
| Randomness | Chainlink VRF v2.5 |
| Max draws | 1 per 24 hours |
| VRF reserve | 0.5% of incoming royalties |
| Payout | Winners call claim() |

All 4,444 BLOCKHEADZ token IDs are seeded into the registry before launch. Holders do not need to register. Owning the token is enough. The contract checks ownerOf live at draw time, so whoever holds the token at that exact moment wins, even if they bought after the seed.

## A few things worth knowing

**The pot is protected.** Emergency withdrawal cannot touch the holder pot, locked draw funds, VRF reserve, or unclaimed winnings. Only ETH that genuinely is not owed to anyone can be pulled out.

**No loops in the draw.** Picking 3 unique token slots uses a fixed deterministic method with no retry loops in the VRF callback. Predictable gas every time.

**Failed slots roll back.** If a selected token is burned or invalid, that share goes back into the pot. Not to us.

**Transfers are transparent.** If a token is sold between the seed and the draw, the new owner wins automatically. No re-registration needed. The contract checks ownerOf live at draw time.

**Burned tokens are removed.** If a burned token is selected by VRF, the share returns to the pot and the slot is auto-removed. cleanupRegistry() can be called by anyone to remove burned slots proactively.

**Settings lock permanently.** NFT contract, threshold, and callback gas are configurable before launch. Once lockConfig() is called they are locked forever.

**Subscription ID can be updated.** If the Chainlink VRF subscription ever needs to change, a 24-hour two-step process is required. No surprise changes mid-round.

**Daily limit.** One draw per 24 hours. If the pot fills faster, it accumulates for a bigger prize next day.

**Late VRF callbacks are safe.** If a draw is cancelled after the 24-hour timeout and Chainlink eventually delivers anyway, the callback exits silently. No funds move, no revert.

## Contract

Source: [BlockShare.sol](./BlockShare.sol)

Pre-mainnet checklist:
- [x] 4 independent audit rounds
- [x] Mainnet fork test, full end-to-end (seed, draw, VRF callback, claim, burned token handling, daily cooldown, cancelStuckRound)
- [ ] Mainnet deploy and Etherscan verification
- [ ] Seed registry with all 4,444 BLOCKHEADZ token IDs
- [ ] Add BlockShare as Chainlink VRF consumer
- [ ] Fund VRF subscription with LINK
- [ ] Set BlockShare as OpenSea royalty recipient
- [ ] Transfer ownership to Safe multisig
- [ ] Call lockConfig()

This is not staking. It is not yield. It is a royalty-funded draw. If nobody trades, the pot does not fill. That is it.
