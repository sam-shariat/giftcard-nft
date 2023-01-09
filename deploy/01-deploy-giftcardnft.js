const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config")

module.exports = async function () {
    let priceFeedAddress
    let chainId = network.config.chainId
    if (developmentChains.includes(network.name)) {
        const DECIMALS = "8"
        const INITIAL_PRICE = "200000000000"

        const mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
        const mockV3Aggregator = await mockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE)
        console.log(`mockV3Aggregator deployed to ${mockV3Aggregator.address} on ${network.name}`)
        const priceFeedResult = (await mockV3Aggregator.latestRoundData()).answer
        console.log("latest eth price from the mock is : ", priceFeedResult / 1e8)
        priceFeedAddress = mockV3Aggregator.address
    } else {
        priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    const giftCardNFTFactory = await ethers.getContractFactory("GiftCard")
    const giftCardNFT = await giftCardNFTFactory.deploy(priceFeedAddress)

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    await giftCardNFT.deployTransaction.wait(waitBlockConfirmations)

    console.log(`GiftCardNFT deployed to ${giftCardNFT.address} on ${network.name}`)
    const ethPrice = await giftCardNFT.getLatestPrice()

    console.log("latest eth price is : ", ethPrice)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: giftCardNFT.address,
            constructorArguments: [priceFeedAddress],
        })
    }
}
