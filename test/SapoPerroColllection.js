const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SapoPerroCollection", function () {

  async function createContract() {

    const SapoPerro = await ethers.getContractFactory('SapoPerroCollection')

    const deploySp = await SapoPerro.deploy()

    const mintCost = await deploySp.mintCost()

    const tokenIdCounter = await deploySp.tokenIdCounter()

    const [ owner, account ] = await ethers.getSigners()

    const provider = ethers.provider

    return { deploySp, mintCost, tokenIdCounter, owner, account, provider }

  }

  describe('constructor', async() => {

    it('shuld init token Id Counter', async() => {

      const {  tokenIdCounter } = await loadFixture( createContract )

      expect( tokenIdCounter ).to.equal( 1 )

    })

    it('shuld set a baseUri', async() => {

      const { deploySp } = await loadFixture( createContract )

      expect( await deploySp.baseUri()).to.equal('')

    })

    it('shuld set the mint Const', async() => {

      const {  mintCost } = await loadFixture( createContract )

      expect( Number(ethers.utils.formatEther(mintCost)) ).to.greaterThan( 0 )

    })

  })

  describe('SetBaseUri', async() => {

    it('should fail when user is not the owner', async() => {

      const { deploySp, account } = await loadFixture( createContract )

      const newBaseUri = 'hola'

      await expect( deploySp.connect(account).setBaseUri(newBaseUri)).to.be.reverted

    })

    it('should change base Uri', async() => {

      const { deploySp } = await loadFixture( createContract )

      const newBaseUri = 'hola'

      await deploySp.setBaseUri(newBaseUri)

      expect( await deploySp.baseUri()).to.equal( newBaseUri )

    })

  })

  describe('Token Uri', async() => {

    it("should fail when the token wasn't minted", async() => {

      const { deploySp } = await loadFixture( createContract )

      await expect( deploySp.tokenURI(1)).to.be.revertedWith("token dosn't exist")

    })

    it('should return token Uri', async() => {

      const { deploySp, mintCost, tokenIdCounter } = await loadFixture( createContract )

      await deploySp.mintSapoPerro( 1, { value: mintCost} )

      const mintedTokenId = tokenIdCounter.toNumber()

      expect( await deploySp.tokenURI( mintedTokenId )).to.equal( '1.json' )

    })

  })

  describe('mintSapoPerro', async() => {

    it("should fail if the sended value is diferent of the mintCost", async() => {

      const { deploySp, mintCost } = await loadFixture( createContract )

      const amount = 2

      await expect( deploySp.mintSapoPerro( amount )).to.be.revertedWith("incorrect value, check mintCost")

      await expect( deploySp.mintSapoPerro( amount, { value: mintCost.mul( 4 )})).to.be.revertedWith("incorrect value, check mintCost")

      await expect( deploySp.mintSapoPerro( amount, { value: mintCost.div( 2 )})).to.be.revertedWith("incorrect value, check mintCost")

    })

    it('should fail when every token was minted', async() => {

      const { deploySp, mintCost } = await loadFixture( createContract )

      for( let i = 0; i < 20; i++) await deploySp.mintSapoPerro( 500, { value: mintCost.mul(500)} )

      await expect( deploySp.mintSapoPerro( 1, { value: mintCost} )).to.be.revertedWith("Sold Out")

    })

    it('should mint a NFT', async() => {

      const { deploySp, mintCost, tokenIdCounter } = await loadFixture( createContract )

      await deploySp.mintSapoPerro( 1, { value: mintCost} )

      expect( await deploySp.tokenURI(tokenIdCounter)).to.equal( '1.json' )

    })

    it("should check if the funds are added correctly", async() => {

      const { deploySp, mintCost, provider } = await loadFixture( createContract )
      
      const balanceBeforeMint = await provider.getBalance(deploySp.address)

      await deploySp.mintSapoPerro( 1, { value: mintCost} )
      
      const balanceAfterMint = await provider.getBalance( deploySp.address )

      expect( balanceBeforeMint ).to.be.lessThan( balanceAfterMint )

    })

  })

  describe('withdraw', async() => {

    it('should fail when the user is not the owner', async() => {

      const { deploySp, account } = await loadFixture( createContract )

      await expect( deploySp.connect(account).withdraw()).to.be.reverted

    })

    it("should fail when contract has not funds", async() => {

      const { deploySp } = await loadFixture( createContract )

      await expect( deploySp.withdraw()).to.be.revertedWith("Can not transfer: insuficent founds")

    })

    it("should check if the funds are withdrawn correctly", async() => {

      const { deploySp, mintCost, provider } = await loadFixture( createContract )

      await deploySp.mintSapoPerro( 50, { value: mintCost.mul(50) } )
      
      const balanceAfterMint = await provider.getBalance( deploySp.address )

      await deploySp.withdraw()
      
      const balanceAfterWithdraw = await provider.getBalance( deploySp.address )

      expect( balanceAfterMint ).to.be.greaterThan( balanceAfterWithdraw )

      expect( balanceAfterWithdraw ).to.be.equal( ethers.BigNumber.from('0') )

    })

  })

  describe('Events', async() => {

    it('should emit an event when a token is minted', async() => {

      const { deploySp, mintCost, account, tokenIdCounter } = await loadFixture( createContract )

      expect( await deploySp.connect(account).mintSapoPerro( 1, { value: mintCost} ))
        .to.emit( account, tokenIdCounter - 1 )

    })

    it('should emit an event when funds are withdrawn', async() => {

      const { deploySp, mintCost, account } = await loadFixture( createContract )

      await deploySp.mintSapoPerro( 50, { value: mintCost.mul(50)} )

      expect( await deploySp.withdraw())
        .to.emit( account, anyValue )

    })
  })

});
