// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import '@openzeppelin/contracts/access/Ownable.sol';

contract SapoPerroCollection is ERC721, Ownable {

    using Counters for Counters.Counter;

    string public baseUri;

    uint256 public mintCost;

    uint256 public totalSupply = 10000;

    event MintSapoPerro( address to, uint256 tokenId);

    event Withdraw( address to, uint256 amount);

    Counters.Counter public tokenIdCounter;

    constructor() ERC721('SapoPerroCollection', 'SPC'){

        tokenIdCounter.increment();

        baseUri = '';

        mintCost = 0.1 ether;

    }

    function setBaseUri( string memory _baseUri) public onlyOwner{

        baseUri = _baseUri;

    }

    function tokenURI( uint256 _tokenId) public view override returns( string memory ){

        require( _exists(_tokenId), "token dosn't exist");

        return string( abi.encodePacked( baseUri, Strings.toString(_tokenId), '.json' ));

    }

    function mintSapoPerro(uint256 _nftsAmount) external payable {

        require(msg.value == mintCost * _nftsAmount, 'incorrect value, check mintCost');

        for(uint256 i; i < _nftsAmount; i++){
            
            require( tokenIdCounter.current() <= totalSupply, 'Sold Out');

            _safeMint(msg.sender, tokenIdCounter.current());
            
            emit MintSapoPerro(msg.sender, tokenIdCounter.current());
            
            tokenIdCounter.increment();
            
        }

    }

    function withdraw() external onlyOwner{

        uint256 balance = address(this).balance;

        require(balance > 0, 'Can not transfer: insuficent founds');

        payable(msg.sender).transfer(balance);

        emit Withdraw(msg.sender, balance);

    }


}
