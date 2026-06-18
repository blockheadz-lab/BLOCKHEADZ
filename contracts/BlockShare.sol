// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BLOCKHEADZ -- BLOCK SHARE
 *
 * Royalty-funded random holder draw for BLOCKHEADZ NFT holders.
 * 5% OpenSea creator royalty routes to this contract.
 * When pot reaches threshold, anyone calls requestRound() (max once per day).
 * Chainlink VRF v2.5 selects 3 unique registered token slots.
 * Winners call claim() to receive their ETH. Team takes zero.
 * 0.5% of incoming royalties auto-reserved for VRF operational costs.
 *
 * Design notes:
 *   - Registry is frozen while a round is in progress (noActiveRound modifier).
 *   - Supply is snapshotted at VRF request time and used in the callback.
 *   - requestRound() and triggerRound() both require configLocked.
 *   - requestRound() enforces a 24hr cooldown between rounds.
 *   - setCallbackGas() is locked after configLocked.
 *   - cancelStuckRound() is permissionless after 24hr.
 *   - 3 unique token slots, not 3 unique addresses.
 *   - Invalid slot shares return to pendingPot, not redistributed in same round.
 *   - Forced ETH (selfdestruct) is not prize money until syncPot() is called.
 *   - Smart contract NFT holders may be unable to claim if their contract
 *     cannot make external calls. claimTo() helps but caller must initiate.
 *   - registeredBy mapping tracks who seeded each token (informational only).
 *   - Transfers are transparent — ownerOf is checked live at draw time.
 *   - removeInactiveToken() removes burned/invalid tokens only.
 */

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC721Minimal {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface ILINK {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract BlockShare is VRFConsumerBaseV2Plus, ReentrancyGuard {

    // Chainlink VRF v2.5 -- values passed via constructor for multi-network safety
    bytes32 public immutable keyHash;
    address public immutable linkToken;
    uint16  constant CONFIRMATIONS  = 3;
    uint32  constant NUM_WORDS      = 3;
    uint256 constant STUCK_TIMEOUT  = 24 hours;

    uint256 public constant WINNERS            = 3;
    uint256 public constant MIN_THRESHOLD      = 0.005 ether;
    uint256 public constant MAX_THRESHOLD      = 1 ether;
    uint256 public constant MAX_REGISTER_BATCH = 50;
    uint256 public constant MAX_CLEANUP_BATCH  = 20;
    uint32  public constant MAX_CALLBACK_GAS   = 750_000;
    uint32  public constant MIN_CALLBACK_GAS   = 500_000; // raised minimum per audit
    uint256 public constant VRF_BPS            = 50;      // 0.5% of royalties → vrfReserve
    uint256 public constant ROUND_INTERVAL     = 24 hours; // max one draw per day

    IERC721Minimal public nftContract;
    uint256        public subscriptionId;
    uint256        public threshold;
    uint32         public callbackGas;
    bool           public configLocked;

    // ── Eligible token registry ───────────────────────────────────────────────
    uint256[] public eligibleTokenIds;
    mapping(uint256 => uint256) private eligibleIndexPlusOne;
    mapping(uint256 => address) public registeredBy; // tokenId → address that registered it

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 public pendingPot;
    uint256 public vrfReserve;    // 0.5% royalty slice reserved for VRF ops
    uint256 public lockedPot;
    uint256 public totalCredited;
    uint256 public totalReturnedToPot;
    uint256 public roundCount;
    bool    public roundInProgress;
    uint256 public roundRequestedAt;
    uint256 public lastRoundAt;   // timestamp of last round *request* (not settlement) -- intentional: prevents VRF spam
    uint256 public activeRequestId;
    uint256 public pendingSubscriptionId;     // two-step subscription update
    uint256 public subscriptionChangeReadyAt; // two-step subscription update

    mapping(address => uint256) public claimable;
    uint256 public totalClaimable;

    struct Round {
        uint256    timestamp;
        uint256    pot;
        uint256    distributed;
        uint256    returnedToPot;
        uint256[3] tokenIds;
        address[3] winners;
        uint256    shareEach;
    }

    Round[] private _roundHistory;

    struct PendingRound {
        uint256 pot;
        uint256 supply;   // snapshotted at request time
        bool    fulfilled;
    }
    mapping(uint256 => PendingRound) public pendingRounds;

    // ── Events ────────────────────────────────────────────────────────────────
    event RoyaltyReceived(uint256 amount, uint256 pendingPot);
    event RoundRequested(uint256 indexed requestId, uint256 pot, uint256 supply);
    event RoundSettled(uint256 indexed roundId, address[3] winners, uint256[3] tokenIds, uint256 shareEach, uint256 distributed, uint256 returnedToPot);
    event RoundReturned(uint256 indexed requestId, uint256 pot, string reason);
    event RoundCancelled(uint256 indexed requestId, uint256 returnedToPot);
    event WinnerClaimed(address indexed winner, address indexed recipient, uint256 amount);
    event TokenRegistered(uint256 indexed tokenId, address indexed registrant);
    event TokenSkipped(uint256 indexed tokenId);
    event TokenRemoved(uint256 indexed tokenId);
    event PotSynced(uint256 amount);
    event VrfReserveWithdrawn(uint256 amount);
    event ThresholdUpdated(uint256 oldVal, uint256 newVal);
    event CallbackGasUpdated(uint32 oldVal, uint32 newVal);
    event SubscriptionIdProposed(uint256 oldId, uint256 proposedId, uint256 readyAt);
    event SubscriptionIdUpdated(uint256 oldId, uint256 newId);
    event ConfigLocked();

    // ── Modifiers ─────────────────────────────────────────────────────────────

    /**
     * @dev Blocks registry mutations while a VRF round is in flight.
     *      Prevents supply/index changes between request and callback.
     */
    modifier noActiveRound() {
        require(!roundInProgress, "Round in progress");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────
    /**
     * @param _vrfCoordinator  Chainlink VRF coordinator (network-specific)
     * @param _keyHash         VRF key hash (network-specific)
     * @param _linkToken       LINK token address (network-specific)
     * @param _nftContract     BLOCKHEADZ NFT contract
     * @param _subscriptionId  Chainlink VRF subscription ID
     *
     * Ethereum Mainnet:
     *   coordinator  0xD7f86b4b8Cae7D942340FF628F82735b7a20893a
     *   keyHash      0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9
     *   linkToken    0x514910771AF9Ca656af840dff83E8264EcF986CA
     *
     * Sepolia:
     *   coordinator  0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1b
     *   keyHash      0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
     *   linkToken    0x779877A7B0D9E8603169DdbD7836e478b4624789
     */
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _linkToken,
        address _nftContract,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_vrfCoordinator != address(0), "Zero coordinator");
        require(_keyHash != bytes32(0),     "Zero keyHash");
        require(_linkToken != address(0),   "Zero LINK address");
        require(_nftContract != address(0), "Zero NFT address");
        require(_subscriptionId != 0,       "Zero subscription");
        keyHash        = _keyHash;
        linkToken      = _linkToken;
        nftContract    = IERC721Minimal(_nftContract);
        subscriptionId = _subscriptionId;
        threshold      = 0.04 ether;
        callbackGas    = 700_000;
    }

    // ── Receive royalties ─────────────────────────────────────────────────────
    receive() external payable {
        uint256 vrf = (msg.value * VRF_BPS) / 10000;
        vrfReserve += vrf;
        pendingPot += msg.value - vrf;
        emit RoyaltyReceived(msg.value, pendingPot);
    }

    fallback() external payable {
        revert("Invalid call");
    }

    // ── Registry -- all mutations blocked during active round ─────────────────

    function eligibleSupply() public view returns (uint256) {
        return eligibleTokenIds.length;
    }

    function isEligibleToken(uint256 tokenId) public view returns (bool) {
        return eligibleIndexPlusOne[tokenId] != 0;
    }

    /**
     * @notice Returns true only if the token is registered AND not burned.
     *         Transfers are fine — the new owner wins automatically.
     *         Use off-chain before requestRound() to verify registry health.
     */
    function isLiveEligible(uint256 tokenId) public view returns (bool) {
        if (!isEligibleToken(tokenId)) return false;
        try nftContract.ownerOf(tokenId) returns (address holder) {
            return holder != address(0);
        } catch {
            return false;
        }
    }

    function registerToken(uint256 tokenId) public noActiveRound {
        require(!isEligibleToken(tokenId), "Already registered");
        address holder = nftContract.ownerOf(tokenId);
        require(holder != address(0), "Invalid token");
        require(holder == msg.sender, "Must be token owner");
        registeredBy[tokenId] = msg.sender;
        eligibleTokenIds.push(tokenId);
        eligibleIndexPlusOne[tokenId] = eligibleTokenIds.length;
        emit TokenRegistered(tokenId, msg.sender);
    }

    function registerTokens(uint256[] calldata tokenIds) external noActiveRound {
        require(tokenIds.length <= MAX_REGISTER_BATCH, "Batch too large -- max 50");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isEligibleToken(tokenIds[i])) continue;
            try nftContract.ownerOf(tokenIds[i]) returns (address holder) {
                if (holder != address(0) && holder == msg.sender) {
                    registeredBy[tokenIds[i]] = msg.sender;
                    eligibleTokenIds.push(tokenIds[i]);
                    eligibleIndexPlusOne[tokenIds[i]] = eligibleTokenIds.length;
                    emit TokenRegistered(tokenIds[i], msg.sender);
                } else {
                    emit TokenSkipped(tokenIds[i]);
                }
            } catch {
                emit TokenSkipped(tokenIds[i]);
            }
        }
    }

    function seedRegistry(uint256[] calldata tokenIds) external onlyOwner noActiveRound {
        require(!configLocked, "Config locked");
        require(tokenIds.length <= MAX_REGISTER_BATCH, "Batch too large -- max 50");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isEligibleToken(tokenIds[i])) continue;
            try nftContract.ownerOf(tokenIds[i]) returns (address holder) {
                if (holder != address(0)) {
                    registeredBy[tokenIds[i]] = holder;
                    eligibleTokenIds.push(tokenIds[i]);
                    eligibleIndexPlusOne[tokenIds[i]] = eligibleTokenIds.length;
                    emit TokenRegistered(tokenIds[i], holder);
                } else {
                    emit TokenSkipped(tokenIds[i]);
                }
            } catch {
                emit TokenSkipped(tokenIds[i]);
            }
        }
    }

    /**
     * @notice Remove a single token that is burned or invalid (ownerOf reverts).
     *         Transferred tokens remain eligible — new owner wins automatically.
     */
    function removeInactiveToken(uint256 tokenId) external noActiveRound {
        require(isEligibleToken(tokenId), "Not registered");
        bool burned;
        try nftContract.ownerOf(tokenId) returns (address holder) {
            burned = (holder == address(0));
        } catch {
            burned = true;
        }
        require(burned, "Token still valid");
        delete registeredBy[tokenId];
        _removeEligibleToken(tokenId);
        // TokenRemoved emitted inside _removeEligibleToken
    }

    function cleanupRegistry(uint256 startIndex) external noActiveRound returns (uint256 nextIndex) {
        uint256 len = eligibleTokenIds.length;
        if (len == 0 || startIndex >= len) return 0;
        uint256 end = startIndex + MAX_CLEANUP_BATCH;
        if (end > len) end = len;
        uint256 i = startIndex;
        while (i < end) {
            uint256 tokenId = eligibleTokenIds[i];
            bool burned;
            try nftContract.ownerOf(tokenId) returns (address holder) {
                burned = (holder == address(0));
            } catch {
                burned = true;
            }
            // Only remove burned/invalid tokens — transfers are fine, new owner wins
            if (burned) {
                delete registeredBy[tokenId];
                _removeEligibleToken(tokenId);
                end = end > 0 ? end - 1 : 0;
                len = eligibleTokenIds.length;
                if (i >= len) break;
            } else {
                i++;
            }
        }
        return (i < eligibleTokenIds.length) ? i : 0;
    }

    function _removeEligibleToken(uint256 tokenId) internal {
        uint256 indexPlusOne = eligibleIndexPlusOne[tokenId];
        require(indexPlusOne != 0, "Not registered");
        uint256 index     = indexPlusOne - 1;
        uint256 lastIndex = eligibleTokenIds.length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = eligibleTokenIds[lastIndex];
            eligibleTokenIds[index] = lastTokenId;
            eligibleIndexPlusOne[lastTokenId] = index + 1;
        }
        eligibleTokenIds.pop();
        delete eligibleIndexPlusOne[tokenId];
        emit TokenRemoved(tokenId);
    }

    // ── Request draw ──────────────────────────────────────────────────────────

    function requestRound() external nonReentrant {
        require(configLocked, "Config not locked -- call lockConfig() first");
        require(pendingPot >= threshold, "Below threshold");
        require(!roundInProgress, "Round in progress");
        require(block.timestamp >= lastRoundAt + ROUND_INTERVAL, "Once per day");
        require(eligibleTokenIds.length >= WINNERS, "Eligible supply too small");
        _requestRound();
    }

    function _requestRound() internal {
        uint256 pot    = pendingPot;
        uint256 supply = eligibleTokenIds.length; // snapshot supply at request time
        pendingPot       = 0;
        lockedPot       += pot;
        roundInProgress  = true;
        roundRequestedAt = block.timestamp;
        lastRoundAt      = block.timestamp;

        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash:              keyHash,
                subId:                subscriptionId,
                requestConfirmations: CONFIRMATIONS,
                callbackGasLimit:     callbackGas,
                numWords:             NUM_WORDS,
                extraArgs:            VRFV2PlusClient._argsToBytes(
                                          VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                                      )
            })
        );

        activeRequestId          = requestId;
        pendingRounds[requestId] = PendingRound({pot: pot, supply: supply, fulfilled: false});
        emit RoundRequested(requestId, pot, supply);
    }

    // ── VRF callback ──────────────────────────────────────────────────────────
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        PendingRound storage pr = pendingRounds[requestId];

        if (pr.fulfilled || pr.pot == 0) return;

        uint256 pot    = pr.pot;
        uint256 supply = pr.supply; // use snapshotted supply, not live array length
        pr.pot       = 0;
        pr.fulfilled = true;

        roundInProgress = false;
        activeRequestId = 0;

        if (lockedPot >= pot) { lockedPot -= pot; } else { lockedPot = 0; }

        if (randomWords.length < WINNERS) {
            pendingPot         += pot;
            totalReturnedToPot += pot;
            emit RoundReturned(requestId, pot, "Insufficient random words");
            return;
        }

        if (supply < WINNERS) {
            pendingPot         += pot;
            totalReturnedToPot += pot;
            emit RoundReturned(requestId, pot, "Eligible supply too small at request time");
            return;
        }

        uint256 shareEach = pot / WINNERS;
        uint256 dust      = pot % WINNERS;
        uint256 roundId   = roundCount++;

        uint256[3] memory indexes = _pickUniqueIndexes(supply, randomWords[0], randomWords[1], randomWords[2]);

        uint256[3] memory tokenIds;
        address[3] memory winners;
        uint256 distributed;
        uint256 returnedToPot;
        uint256[3] memory removedTokenIds; // burned/invalid tokens only
        uint256 removedCount;

        for (uint256 i = 0; i < WINNERS; i++) {
            // Guard: snapshot index may exceed live array if tokens were removed
            // after the round was cancelled (shouldn't happen with noActiveRound,
            // but defensive check costs nothing).
            if (indexes[i] >= eligibleTokenIds.length) {
                uint256 slot = (i == 0) ? shareEach + dust : shareEach;
                pendingPot    += slot;
                returnedToPot += slot;
                continue;
            }

            uint256 tokenId = eligibleTokenIds[indexes[i]];
            tokenIds[i] = tokenId;

            address winner;
            try nftContract.ownerOf(tokenId) returns (address _owner) {
                winner = _owner;
            } catch {
                winner = address(0);
            }

            // Only reject burned/invalid tokens (ownerOf reverts or returns zero).
            // Transfers are fine — whoever holds the token at draw time wins.
            if (winner == address(0)) {
                uint256 slot = (i == 0) ? shareEach + dust : shareEach;
                pendingPot    += slot;
                returnedToPot += slot;
                removedTokenIds[removedCount++] = tokenId;
                continue;
            }

            winners[i] = winner;
            uint256 credit = (i == 0) ? shareEach + dust : shareEach;
            claimable[winner] += credit;
            totalClaimable    += credit;
            distributed       += credit;
        }

        for (uint256 j = 0; j < removedCount; j++) {
            if (isEligibleToken(removedTokenIds[j])) {
                delete registeredBy[removedTokenIds[j]];
                _removeEligibleToken(removedTokenIds[j]);
            }
        }

        totalCredited   += distributed;
        totalReturnedToPot += returnedToPot;

        _roundHistory.push(Round({
            timestamp:    block.timestamp,
            pot:          pot,
            distributed:  distributed,
            returnedToPot: returnedToPot,
            tokenIds:     tokenIds,
            winners:      winners,
            shareEach:    shareEach
        }));

        emit RoundSettled(roundId, winners, tokenIds, shareEach, distributed, returnedToPot);
    }

    function _pickUniqueIndexes(
        uint256 supply,
        uint256 r0,
        uint256 r1,
        uint256 r2
    ) internal pure returns (uint256[3] memory idx) {
        idx[0] = r0 % supply;
        uint256 x1 = r1 % (supply - 1);
        if (x1 >= idx[0]) x1 += 1;
        idx[1] = x1;
        uint256 x2 = r2 % (supply - 2);
        uint256 lo = idx[0] < idx[1] ? idx[0] : idx[1];
        uint256 hi = idx[0] < idx[1] ? idx[1] : idx[0];
        if (x2 >= lo) x2 += 1;
        if (x2 >= hi) x2 += 1;
        idx[2] = x2;
    }

    // ── Claim ─────────────────────────────────────────────────────────────────

    function claim() external nonReentrant {
        _claim(msg.sender, payable(msg.sender));
    }

    function claimTo(address payable recipient) external nonReentrant {
        require(recipient != address(0), "Zero recipient");
        _claim(msg.sender, recipient);
    }

    function _claim(address account, address payable recipient) internal {
        uint256 amount = claimable[account];
        require(amount > 0, "Nothing to claim");
        claimable[account] = 0;
        totalClaimable    -= amount;
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Transfer failed");
        emit WinnerClaimed(account, recipient, amount);
    }

    // ── Cancel stuck round -- permissionless after 24hr ───────────────────────
    function cancelStuckRound(uint256 requestId) external {
        require(roundInProgress, "No round in progress");
        require(block.timestamp >= roundRequestedAt + STUCK_TIMEOUT, "Too early - wait 24hr");
        require(requestId == activeRequestId, "Not active request");
        PendingRound storage pr = pendingRounds[requestId];
        require(!pr.fulfilled && pr.pot > 0, "Invalid request");

        uint256 pot  = pr.pot;
        pr.pot       = 0;
        pr.fulfilled = true;
        roundInProgress = false;
        activeRequestId = 0;

        if (lockedPot >= pot) { lockedPot -= pot; } else { lockedPot = 0; }

        pendingPot         += pot;
        totalReturnedToPot += pot;
        emit RoundCancelled(requestId, pot);
    }

    // ── View ──────────────────────────────────────────────────────────────────

    function getRound(uint256 index) external view returns (Round memory) {
        require(index < _roundHistory.length, "Out of range");
        return _roundHistory[index];
    }

    function roundHistoryLength() external view returns (uint256) {
        return _roundHistory.length;
    }

    function getLastRound() external view returns (Round memory) {
        require(_roundHistory.length > 0, "No rounds yet");
        return _roundHistory[_roundHistory.length - 1];
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function availableToWithdraw() public view returns (uint256) {
        uint256 owed = pendingPot + lockedPot + totalClaimable + vrfReserve;
        uint256 bal  = address(this).balance;
        return bal > owed ? bal - owed : 0;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function syncPot() external {
        uint256 excess = availableToWithdraw();
        if (excess > 0) {
            pendingPot += excess;
            emit PotSynced(excess);
        }
    }

    function withdrawVrfReserve() external onlyOwner {
        uint256 amt = vrfReserve;
        require(amt > 0, "No VRF reserve");
        vrfReserve = 0;
        (bool sent, ) = payable(owner()).call{value: amt}("");
        require(sent, "Transfer failed");
        emit VrfReserveWithdrawn(amt);
    }

    function lockConfig() external onlyOwner {
        require(!configLocked, "Already locked");
        configLocked = true;
        emit ConfigLocked();
    }

    function setNftContract(address _nft) external onlyOwner {
        require(!configLocked, "Config locked");
        require(_nft != address(0), "Zero address");
        nftContract = IERC721Minimal(_nft);
    }

    function setThreshold(uint256 _threshold) external onlyOwner {
        require(!configLocked, "Config locked");
        require(_threshold >= MIN_THRESHOLD, "Below min 0.005 ETH");
        require(_threshold <= MAX_THRESHOLD, "Above max 1 ETH");
        emit ThresholdUpdated(threshold, _threshold);
        threshold = _threshold;
    }

    // callbackGas locked after configLocked -- prevents griefing via low gas
    function setCallbackGas(uint32 _gas) external onlyOwner {
        require(!configLocked, "Config locked");
        require(_gas >= MIN_CALLBACK_GAS, "Too low");
        require(_gas <= MAX_CALLBACK_GAS, "Too high");
        emit CallbackGasUpdated(callbackGas, _gas);
        callbackGas = _gas;
    }

    uint256 public constant SUBSCRIPTION_CHANGE_DELAY = 24 hours;

    function proposeSubscriptionId(uint256 _subId) external onlyOwner {
        require(!roundInProgress, "Round in progress");
        require(_subId != 0, "Zero subscription");
        pendingSubscriptionId     = _subId;
        subscriptionChangeReadyAt = block.timestamp + SUBSCRIPTION_CHANGE_DELAY;
        emit SubscriptionIdProposed(subscriptionId, _subId, subscriptionChangeReadyAt);
    }

    function acceptSubscriptionId() external onlyOwner {
        require(pendingSubscriptionId != 0, "No pending subscription");
        require(block.timestamp >= subscriptionChangeReadyAt, "Delay not passed");
        require(!roundInProgress, "Round in progress");
        uint256 oldId          = subscriptionId;
        uint256 newId          = pendingSubscriptionId;
        subscriptionId         = newId;
        pendingSubscriptionId  = 0;
        subscriptionChangeReadyAt = 0;
        emit SubscriptionIdUpdated(oldId, newId);
    }

    // triggerRound also requires configLocked -- consistent with requestRound
    function triggerRound() external onlyOwner {
        require(configLocked, "Config not locked");
        require(pendingPot >= threshold, "Below threshold");
        require(!roundInProgress, "Round in progress");
        require(block.timestamp >= lastRoundAt + ROUND_INTERVAL, "Once per day");
        require(eligibleTokenIds.length >= WINNERS, "Eligible supply too small");
        _requestRound();
    }

    function emergencyWithdraw() external onlyOwner {
        require(!roundInProgress, "Round in progress");
        uint256 available = availableToWithdraw();
        require(available > 0, "Nothing beyond obligations");
        (bool sent, ) = payable(owner()).call{value: available}("");
        require(sent, "Transfer failed");
    }

    function withdrawLink() external onlyOwner {
        require(!roundInProgress, "Round in progress");
        ILINK link = ILINK(linkToken);
        uint256 bal = link.balanceOf(address(this));
        require(bal > 0, "No LINK");
        require(link.transfer(owner(), bal), "LINK transfer failed");
    }

    function initiateOwnershipTransfer(address _newOwner) external onlyOwner {
        transferOwnership(_newOwner);
    }
    // acceptOwnership() inherited from ConfirmedOwner
}
