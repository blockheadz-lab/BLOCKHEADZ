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
