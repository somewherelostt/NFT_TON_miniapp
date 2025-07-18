// SPDX-License-Identifier: MIT
// Simple TON NFT Collection Contract (Tact)

// This contract allows minting NFTs to user addresses on TON testnet.
// It is simplified for MVP and testnet use.

contract NFTCollection {
    // Owner of the collection
    address owner;
    // Next token ID
    int nextId;
    // Mapping from token ID to owner
    map<int, address> tokens;

    // Event for minting
    event Mint(address to, int tokenId);

    // Constructor: set owner
    constructor() {
        owner = msg.sender;
        nextId = 1;
    }

    // Mint a new NFT to 'to' address
    public function mint(address to) {
        require(msg.sender == owner, 100, "Only owner can mint");
        int tokenId = nextId;
        tokens[tokenId] = to;
        nextId = nextId + 1;
        emit Mint(to, tokenId);
    }

    // Get owner of a token
    public function ownerOf(int tokenId) returns (address) {
        return tokens[tokenId];
    }

    // Get total minted
    public function totalMinted() returns (int) {
        return nextId - 1;
    }
} 