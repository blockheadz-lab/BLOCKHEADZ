# BLOCK SHARE

BLOCKHEADZ uses a 5% creator **royalty enforced on OpenSea**. The royalty payout is routed directly into the BlockShare smart contract instead of a team wallet.

When the pot hits the threshold, anyone can trigger a draw. Chainlink VRF picks **3 random registered** BLOCKHEADZ token slots. The current holders of those tokens can claim their ETH.

We get nothing from the BlockShare pot.

---

## How it works

```
OpenSea secondary sale
        │
        │  5% creator royalty
        ▼
BlockShare.sol  ← pot builds up here
        │
        │  pot >= 0.04 ETH?
        ▼
requestRound()  ← anyone can call this
        │
        │  Chainlink VRF
        ▼
3 random token slots selected
        │
        └── holders claim their ETH share
```

The royalty receiver just accepts ETH. It doesn't try to trigger a draw at the same time — that's a separate step once the pot is ready. Means royalties can land cleanly regardless of what's happening with Chainlink.

---

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
| Payout | Winners call claim() |

---

The registry is seeded before launch with all minted BLOCKHEADZ token IDs. Anyone can register newly minted tokens after that via `registerToken(tokenId)`.

---

## A few things worth knowing

**The pot is protected.** Emergency withdrawal can't touch the holder pot, locked draw funds, or unclaimed winnings. Only ETH that genuinely isn't owed to anyone can be pulled out.

**No loops in the draw.** Picking 3 unique token slots uses a fixed deterministic method — no retry loops in the VRF callback, predictable gas every time.

**Failed slots roll back.** If a selected token can't be resolved, that share goes back into the pot. Not to us.

**Settings lock after the first draw request.** NFT contract and threshold can be configured before launch. Once the first draw is requested, they're locked permanently.

**Late VRF callbacks are safe.** If a draw is cancelled after the 2hr timeout and Chainlink eventually delivers the random number anyway, the callback exits silently. No funds move, no revert.

---

## Contract

Source: [`BlockShare.sol`](./BlockShare.sol)

Pre-mainnet checklist:
- Sepolia deploy + full flow test
- Etherscan verification
- Seed the BlockShare eligible-token registry with minted BLOCKHEADZ token IDs
- Add BlockShare as Chainlink VRF consumer
- Fund VRF subscription
- Set BlockShare as OpenSea royalty recipient
- Transfer ownership to Safe multisig

---

This isn't staking. It isn't yield. It's a royalty-funded draw. If nobody trades, the pot doesn't fill. That's it.
