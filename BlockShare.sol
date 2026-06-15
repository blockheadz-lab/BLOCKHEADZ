// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BLOCKHEADZ -- BLOCK SHARE
 *
 * Royalty-funded random holder draw for BLOCKHEADZ NFT holders.
 * 5% OpenSea creator royalty routes to this contract.
 * When pot reaches threshold, anyone calls requestRound().
 * Chainlink VRF v2.5 selects 3 unique registered token slots.
 * Winners call claim() to receive their ETH. Team takes zero.
 */

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IERC721Minimal {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract BlockShare is VRFConsumerBaseV2Plus {

    // Coordinator: 0xD7f86b4b8Cae7D942340FF628F82735b7a20893a
    bytes32 constant KEY_HASH      = 0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9;
    uint16  constant CONFIRMATIONS = 3;
    uint32  constant NUM_WORDS     = 3;
    uint256 constant STUCK_TIMEOUT = 2 hours;

    uint256 public constant WINNERS       = 3;
    uint256 public constant MIN_THRESHOLD = 0.005 ether;
    uint256 public constant MAX_THRESHOLD = 1 ether;

    IERC721Minimal public nftContract;
    uint256        public subscriptionId;
    uint256        public threshold;
    uint32         public callbackGas;
    bool           public roundLocked;

    // ── Eligible token registry ───────────────────────────────────────────────
    uint256[] public eligibleTokenIds;
    mapping(uint256 => uint256) private eligibleIndexPlusOne; // tokenId => index+1

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 public pendingPot;
    uint256 public lockedPot;
    uint256 public totalDistributed;
    uint256 public totalRefunded;
    uint256 public roundCount;
    bool    public roundInProgress;
    uint256 public roundRequestedAt;
    uint256 public activeRequestId;

    mapping(address => uint256) public claimable;
    uint256 public totalClaimable;

    struct Round {
        uint256    timestamp;
        uint256    pot;
        uint256    distributed;
        uint256    refunded;
        uint256[3] tokenIds;
        address[3] winners;
        uint256    shareEach;
    }

    Round[] public roundHistory;

    struct PendingRound {
        uint256 pot;
        bool    fulfilled;
    }
    mapping(uint256 => PendingRound) public pendingRounds;

    // ── Events ────────────────────────────────────────────────────────────────
    event RoyaltyReceived(uint256 amount, uint256 pendingPot);
    event RoundRequested(uint256 indexed requestId, uint256 pot);
    event RoundSettled(uint256 indexed roundId, address[3] winners, uint256[3] tokenIds, uint256 shareEach, uint256 distributed, uint256 refunded);
    event RoundCancelled(uint256 indexed requestId, uint256 potRefunded);
    event WinnerClaimed(address indexed winner, uint256 amount);
    event TokenRegistered(uint256 indexed tokenId);
    event TokenRemoved(uint256 indexed tokenId);
    event ThresholdUpdated(uint256 oldVal, uint256 newVal);
    event CallbackGasUpdated(uint32 oldVal, uint32 newVal);
    event SubscriptionIdUpdated(uint256 oldId, uint256 newId);
    event NftContractUpdated(address indexed newContract);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address _vrfCoordinator,
        address _nftContract,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_nftContract != address(0), "Zero NFT address");
        require(_subscriptionId != 0, "Zero subscription");
        nftContract    = IERC721Minimal(_nftContract);
        subscriptionId = _subscriptionId;
        threshold      = 0.04 ether;
        callbackGas    = 400_000;
    }

    // ── Receive royalties -- never calls VRF ──────────────────────────────────
    receive() external payable {
        pendingPot += msg.value;
        emit RoyaltyReceived(msg.value, pendingPot);
    }

    fallback() external payable {
        pendingPot += msg.value;
        emit RoyaltyReceived(msg.value, pendingPot);
    }

    // ── Eligible token registry ───────────────────────────────────────────────

    function eligibleSupply() public view returns (uint256) {
        return eligibleTokenIds.length;
    }

    function isEligibleToken(uint256 tokenId) public view returns (bool) {
        return eligibleIndexPlusOne[tokenId] != 0;
    }

    /**
     * @notice Register a single minted token ID.
     *         Anyone can call this. Verified via ownerOf() on the NFT contract.
     */
    function registerToken(uint256 tokenId) public {
        require(!isEligibleToken(tokenId), "Already registered");
        address holder = nftContract.ownerOf(tokenId);
        require(holder != address(0), "Invalid token");
        eligibleTokenIds.push(tokenId);
        eligibleIndexPlusOne[tokenId] = eligibleTokenIds.length;
        emit TokenRegistered(tokenId);
    }

    /**
     * @notice Register multiple token IDs in one call.
     *         Skips already-registered or invalid tokens silently.
     *         Use this to seed the registry before the first draw.
     */
    function registerTokens(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isEligibleToken(tokenIds[i])) continue;
            try nftContract.ownerOf(tokenIds[i]) returns (address holder) {
                if (holder != address(0)) {
                    eligibleTokenIds.push(tokenIds[i]);
                    eligibleIndexPlusOne[tokenIds[i]] = eligibleTokenIds.length;
                    emit TokenRegistered(tokenIds[i]);
                }
            } catch {}
        }
    }

    /**
     * @notice Remove a token that is no longer valid (burned or ownerOf reverts).
     *         Anyone can call this to keep the registry clean.
     */
    function removeInvalidToken(uint256 tokenId) public {
        require(isEligibleToken(tokenId), "Not registered");
        bool invalid;
        try nftContract.ownerOf(tokenId) returns (address holder) {
            invalid = (holder == address(0));
        } catch {
            invalid = true;
        }
        require(invalid, "Token still valid");
        _removeEligibleToken(tokenId);
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

    // ── Request draw -- public, anyone can call ───────────────────────────────
    function requestRound() external {
        require(pendingPot >= threshold, "Below threshold");
        require(!roundInProgress, "Round in progress");
        require(eligibleTokenIds.length >= WINNERS, "Eligible supply too small");
        _requestRound();
    }

    function _requestRound() internal {
        if (!roundLocked) roundLocked = true;

        uint256 pot      = pendingPot;
        pendingPot       = 0;
        lockedPot       += pot;
        roundInProgress  = true;
        roundRequestedAt = block.timestamp;

        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash:              KEY_HASH,
                subId:                subscriptionId,
                requestConfirmations: CONFIRMATIONS,
                callbackGasLimit:     callbackGas,
                numWords:             NUM_WORDS,
                extraArgs:            VRFV2PlusClient._argsToBytes(
                                          VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                                      )
            })
        );

        activeRequestId  = requestId;
        pendingRounds[requestId] = PendingRound({ pot: pot, fulfilled: false });
        emit RoundRequested(requestId, pot);
    }

    // ── VRF callback ──────────────────────────────────────────────────────────
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        PendingRound storage pr = pendingRounds[requestId];

        if (pr.fulfilled || pr.pot == 0) return;

        uint256 pot  = pr.pot;
        pr.pot       = 0;
        pr.fulfilled = true;

        roundInProgress = false;
        activeRequestId = 0;
        lockedPot      -= pot;

        if (randomWords.length < WINNERS) {
            pendingPot    += pot;
            totalRefunded += pot;
            return;
        }

        uint256 supply = eligibleTokenIds.length;
        if (supply < WINNERS) {
            pendingPot    += pot;
            totalRefunded += pot;
            return;
        }

        uint256 shareEach = pot / WINNERS;
        uint256 dust      = pot % WINNERS;
        uint256 roundId   = roundCount++;

        uint256[3] memory indexes = _pickUniqueIndexes(
            supply,
            randomWords[0],
            randomWords[1],
            randomWords[2]
        );

        uint256[3] memory tokenIds;
        address[3] memory winners;
        uint256 distributed;
        uint256 refunded;

        uint256[3] memory invalidTokenIds;
        uint256 invalidCount;

        for (uint256 i = 0; i < WINNERS; i++) {
            uint256 tokenId = eligibleTokenIds[indexes[i]];
            tokenIds[i] = tokenId;

            address winner;
            try nftContract.ownerOf(tokenId) returns (address _owner) {
                winner = _owner;
            } catch {
                winner = address(0);
            }

            if (winner == address(0)) {
                uint256 slot = (i == 0) ? shareEach + dust : shareEach;
                pendingPot += slot;
                refunded   += slot;
                invalidTokenIds[invalidCount++] = tokenId;
                continue;
            }

            winners[i] = winner;
            uint256 credit = (i == 0) ? shareEach + dust : shareEach;
            claimable[winner] += credit;
            totalClaimable    += credit;
            distributed       += credit;
        }

        for (uint256 j = 0; j < invalidCount; j++) {
            if (isEligibleToken(invalidTokenIds[j])) {
                _removeEligibleToken(invalidTokenIds[j]);
            }
        }

        totalDistributed += distributed;
        totalRefunded    += refunded;

        roundHistory.push(Round({
            timestamp:   block.timestamp,
            pot:         pot,
            distributed: distributed,
            refunded:    refunded,
            tokenIds:    tokenIds,
            winners:     winners,
            shareEach:   shareEach
        }));

        emit RoundSettled(roundId, winners, tokenIds, shareEach, distributed, refunded);
    }

    /**
     * @dev Deterministic unique index selection -- no loops, O(1), guaranteed unique.
     *      Partial Fisher-Yates arithmetic over the eligible registry.
     */
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
    function claim() external {
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "Nothing to claim");
        claimable[msg.sender] = 0;
        totalClaimable       -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer failed");
        emit WinnerClaimed(msg.sender, amount);
    }

    // ── Cancel stuck round ────────────────────────────────────────────────────
    function cancelStuckRound(uint256 requestId) external onlyOwner {
        require(roundInProgress, "No round in progress");
        require(block.timestamp >= roundRequestedAt + STUCK_TIMEOUT, "Too early - wait 2hr");
        require(requestId == activeRequestId, "Not active request");
        PendingRound storage pr = pendingRounds[requestId];
        require(!pr.fulfilled, "Already fulfilled");
        require(pr.pot > 0, "No pot");
        uint256 pot  = pr.pot;
        pr.pot       = 0;
        pr.fulfilled = true;
        roundInProgress = false;
        activeRequestId = 0;
        lockedPot      -= pot;
        pendingPot     += pot;
        totalRefunded  += pot;
        emit RoundCancelled(requestId, pot);
    }

    // ── View ──────────────────────────────────────────────────────────────────
    function getRoundHistory() external view returns (Round[] memory) {
        return roundHistory;
    }

    function getLastRound() external view returns (Round memory) {
        require(roundHistory.length > 0, "No rounds yet");
        return roundHistory[roundHistory.length - 1];
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function availableToWithdraw() public view returns (uint256) {
        uint256 owed = pendingPot + lockedPot + totalClaimable;
        uint256 bal  = address(this).balance;
        return bal > owed ? bal - owed : 0;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    function setNftContract(address _nft) external onlyOwner {
        require(!roundLocked, "NFT locked after first round request");
        require(_nft != address(0), "Zero address");
        nftContract = IERC721Minimal(_nft);
        emit NftContractUpdated(_nft);
    }

    function setThreshold(uint256 _threshold) external onlyOwner {
        require(!roundLocked, "Threshold locked after first round request");
        require(_threshold >= MIN_THRESHOLD, "Below min 0.005 ETH");
        require(_threshold <= MAX_THRESHOLD, "Above max 1 ETH");
        emit ThresholdUpdated(threshold, _threshold);
        threshold = _threshold;
    }

    function setCallbackGas(uint32 _gas) external onlyOwner {
        require(_gas >= 100_000, "Too low");
        require(_gas <= 2_500_000, "Above coordinator max");
        emit CallbackGasUpdated(callbackGas, _gas);
        callbackGas = _gas;
    }

    function setSubscriptionId(uint256 _subId) external onlyOwner {
        require(!roundInProgress, "Round in progress");
        require(_subId != 0, "Zero subscription");
        emit SubscriptionIdUpdated(subscriptionId, _subId);
        subscriptionId = _subId;
    }

    function triggerRound() external onlyOwner {
        require(pendingPot >= threshold, "Below threshold");
        require(!roundInProgress, "Round in progress");
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

    function initiateOwnershipTransfer(address _newOwner) external onlyOwner {
        transferOwnership(_newOwner);
    }
    // acceptOwnership() inherited from ConfirmedOwner
}
