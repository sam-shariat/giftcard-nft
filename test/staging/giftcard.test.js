const { network, ethers } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("GiftCard NFT Unit Tests", async function () {
          let giftCard, tokenId, chainId
          //const [deployer] = await ethers.getSigners()
          before(async function () {
              chainId = network.config.chainId

              tokenId = 0
              const [deployer] = await ethers.getSigners()
              const priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
              const giftCardNFTFactory = await ethers.getContractFactory("GiftCard")
              giftCard = await giftCardNFTFactory.connect(deployer).deploy(priceFeedAddress)
              const waitBlockConfirmations = developmentChains.includes(network.name)
                  ? 1
                  : VERIFICATION_BLOCK_CONFIRMATIONS
              await giftCard.deployTransaction.wait(waitBlockConfirmations)
          })

          describe("Deployment", async function () {
              it("aggregator mock address should be same as pricefeed address in the giftcard contract", async function () {
                  const priceFeedAddress = await giftCard.getPriceFeed()
                  const expectedPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

                  assert.equal(priceFeedAddress, expectedPriceFeedAddress)
              })

              it("price feed api must return some value", async function () {
                  const price = await giftCard.getLatestPrice()
                  assert(price > 0)
              })
          })

          describe("Minting a GiftCard NFT", async function () {
              it("fails if no text is sent", async function () {
                  const [deployer] = await ethers.getSigners()
                  await expect(
                      giftCard.safeMint(deployer.address, "")
                  ).to.be.revertedWithCustomError(giftCard, "GiftCard__TextIsEmpty")
              })

              it("fails if no ETH is sent", async function () {
                  const [deployer] = await ethers.getSigners()
                  await expect(
                      giftCard.safeMint(deployer.address, "Happy Birthday")
                  ).to.be.revertedWithCustomError(giftCard, "GiftCard__NotEnoughETH")
              })

              it("sets NFT value correctly", async function () {
                  tokenId = 0
                  const [deployer] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.04")
                  const nft = await giftCard.safeMint(deployer.address, "Nice Job", {
                      value: sentValue,
                  })

                  await nft.wait(1)
                  const valueOfNFT = await giftCard.valueOfGCN(tokenId.toString())
                  assert.equal(sentValue.toString(), valueOfNFT.toString())
                  tokenId++
              })

              it("sets NFT uri json correctly", async function () {
                  const [deployer] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.02")
                  const nft = await giftCard.safeMint(deployer.address, "Good Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  const tokenUri = await giftCard.tokenURI(tokenId.toString())
                  const expectedTokenUri =
                      "data:application/json;base64,eyJuYW1lIjogIkdvb2QgSm9iIiwgImRlc2NyaXB0aW9uIjogIlVuaXR5IDQwIFVTRCBHaWZ0IENhcmQiLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCNGJXeHVjejBuYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNuSUhodGJHNXpPbmhzYVc1clBTZG9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1TDNoc2FXNXJKeUJwWkQwblpYWkxZbmxaYTFWVVQyUXhKeUIyYVdWM1FtOTRQU2N3SURBZ01USXdNQ0EzTVRrbklITm9ZWEJsTFhKbGJtUmxjbWx1WnowbloyVnZiV1YwY21salVISmxZMmx6YVc5dUp5QjBaWGgwTFhKbGJtUmxjbWx1WnowbloyVnZiV1YwY21salVISmxZMmx6YVc5dUp5QnpkSGxzWlQwblltRmphMmR5YjNWdVpDMWpiMnh2Y2pvak1URXhKejQ4Y21WamRDQjNhV1IwYUQwbk1USXdNQzQ0TnpnMk56WW5JR2hsYVdkb2REMG5NalkwTGpNek9ESXpOU2NnY25nOUp6QW5JSEo1UFNjd0p5QjBjbUZ1YzJadmNtMDlKMjFoZEhKcGVDZ3hMakU0TkRFeUxTNHhOVGcwT1RNZ01DNHlNekF5TWpNZ01TNDNNakF3TWpjdE1qQXlMakkzTnpRMU1pQTFNRFF1TURFeU1EQTBLU2NnWm1sc2JEMG5JekUxTVRVeE5TY2djM1J5YjJ0bExYZHBaSFJvUFNjd0p5OCtQSEpsWTNRZ2QybGtkR2c5SnpFeU1EQXVPRGM0TmpjMkp5Qm9aV2xuYUhROUp6STJOQzR6TXpneU16VW5JSEo0UFNjd0p5QnllVDBuTUNjZ2RISmhibk5tYjNKdFBTZHRZWFJ5YVhnb01TNHhPRGd6TnpjdExqRXlNalUyTVNBd0xqRTNPREF5T1NBeExqY3lOakl4TFRFMU55NHdOemd3TmpRZ05UQTNMalF6T0RReU5pa25JR1pwYkd3OUp5TXlNakluSUhOMGNtOXJaUzEzYVdSMGFEMG5NQ2N2UGp4eVpXTjBJSGRwWkhSb1BTY3hNakF3TGpnM09EWTNOaWNnYUdWcFoyaDBQU2N5TmpRdU16TTRNak0xSnlCeWVEMG5NQ2NnY25rOUp6QW5JSFJ5WVc1elptOXliVDBuYldGMGNtbDRLREV1TVRreE56UXlMUzR3T0RNM016VWdNQzR4TWpFMk16RWdNUzQzTXpFd09UZ3RNVEl4TGpZME5EVTVJRFV4TXk0ME56azFNamdwSnlCbWFXeHNQU2NqTWpVeU5USTFKeUJ6ZEhKdmEyVXRkMmxrZEdnOUp6QW5MejQ4Y21WamRDQjNhV1IwYUQwbk1UazVMakV6TkRnd05DY2dhR1ZwWjJoMFBTY3hORFl1TWpZM01UVTNKeUJ5ZUQwbk56TXVNVE1uSUhKNVBTYzNNeTR4TXljZ2RISmhibk5tYjNKdFBTZHRZWFJ5YVhnb0xqYzNOREl6TWlBd0lEQWdNU0E1TWpNdU16UTBNekk1SURnd0tTY2dabWxzYkQwbkl6TXpNeWNnYzNSeWIydGxMWGRwWkhSb1BTY3dKeUJ6ZEhKdmEyVXRiR2x1WldOaGNEMG5jbTkxYm1RbklITjBjbTlyWlMxc2FXNWxhbTlwYmowbmNtOTFibVFuTHo0OFp5QjBjbUZ1YzJadmNtMDlKMjFoZEhKcGVDZ3hJREFnTUMweElEWXlOaTQ1TXpJMk1UTWdOVEV5TGpRMk9UQXhNeWtuUGp4d1lYUm9JR1E5SjAweU5UQXVOalkyTERFeE9DNDJNRFZETVRZMkxqWXpMREV6Tnk0NE5qSXNOemd1T0RVeExESXhNQzQzTWpJc056Z3VPRE16TERNek9TNHlOVU0zT0M0NE1EWTFMRFV5T0M0eU1qY3NNakkzTGpNMk1pdzJOREVzTXpjekxqVXNOalF4WXpFMk1TNHhOREVzTUN3eU9UWXVNRGsyTFRFeU5pNDFOaXd5T1RZdU1USTFMVE13TVM0M05VTTJOamt1TmpVNUxERXpNaTR4TWpjc05EZ3pMamN4TVN3M05pNDBNakE1TERRek5TNDFMRGMyTGpReU1EbGpMVEkwTGpFMk1pd3dMVFF6TGpjMUxERTVMalU0TnprdE5ETXVOelVzTkRNdU56VXdNV013TERJeUxqWXhNeXd4Tnk0ek1qTXNOREV1TkRJMExETTVMamN5T1N3ME15NHpNRGRqTmpZdU56ZzVMRGN1TkRjekxERTBPUzR6Tnprc05qRXVOek0zTERFME9TNHpPVFlzTVRjMUxqYzNNa00xT0RBdU9EazFMRFEzTnk0d09EWXNORGN5TGpVNU5pdzFOVEVzTXpjekxqVXNOVFV4WXkwNE1TNHlMREF0TWpBeUxqazNOaTAxT1M0eE16Z3RNakF6TFRJeE1TNDNOVU14TnpBdU5EZzFMREkwTXk0M01UVXNNalV4TGpFM01Td3lNRFVzTXpFeExESXdOV2d4TURCak5qa3VPVGMzTERJdU5EYzFMREV5TlM0ME9EY3NOVFF1TkRZMUxERXlOUzQxTERFek5DNHlOUzR3TVRnc01URXpMamszT1MwNE9TNDRNVGdzTVRZMkxqYzFMVEUyTXl3eE5qWXVOelV0TmpNdU1Ua3pMREF0TVRVM0xqazJNaTAwTlM0ek56TXRNVFUzTGprNE1pMHhOall1TnpVdExqQXdPQzAwT0M0M09EUXNNamd1TkRBMkxUWTBMalkzTkN3ME55NHpORE10TmpRdU5qYzBZekkxTGpNekxEQXNOREV1TlRBeUxESTBMalUyTkN3ME1TNDFNRElzTkRZdU9EazBZekFzTVRZdU1EVXlMUzQwTkRVc01qRXVOalUyTFM0eE9UY3NNamN1TURrMlF6TXdOaTR3TWpVc016ZzJMak0zTWl3ek16WXVNakE1TERReE5pd3pOek11TlN3ME1UWmpOREl1T0RZekxEQXNOekV1TmpnM0xUTTFMalU1TVN3M01TNDJPRGN0TnpBdU5XTXdMVEV4TGpjNUxURXVOelE0TFRJeUxqYzBOUzAyTGpJM05TMHpNeTR3TkRaTk5ETTFMalVzTVRJd0xqRTNNV000TkM0eU5USXNPQzQ1TkRNc01UZzVMamN5T1N3M055NDNNaklzTVRnNUxqYzFMREl4T1M0d056bEROakkxTGpJM05TdzFNRFV1TlRjc05Ea3pMakkyTXl3MU9UWXNNemN6TGpVc05UazJZeTB4TXpndU1qQTBMREF0TWpRNExqZ3hMVEV3T1M0ME1qVXRNalE0TGpnek5DMHlOVFl1TnpVdExqQXhPQzB4TVRJdU16WXlMRGd5TGpVME55MHhOakV1TmpFNUxERXpOeTR3TkRRdE1UYzBMamN4TTJNeU1TNDFOeTAwTGpBNU5pd3pOeTQyTWpNdE1qTXVNelEyTERNM0xqWXlNeTAwTlM0NU16SmpNQzB5Tmk0NE56ZzBMVEl4TGpjNE9TMDBPQzQyTmpVMUxUUTRMalkyTmkwME9DNDJOalUxUXpJd055NHpOellzTmprdU9UTTVOU3d6TXl3eE5ETXVOVEF5TERNekxETXpPUzR5TlVNek15dzFOVEl1TVRjNExESXdNU3cyT0RZc016Y3pMalVzTmpnMlF6VTJNeTR6TWpNc05qZzJMRGN4TXk0NU5qZ3NOVE0wTGpnd05TdzNNVFFzTXpNNUxqSTFZeTR3TXpndE1qTTBMamd6TXkweU1UQXVORFEyTFRNd05pNDFOemt4TFRJM09DNDFMVE13Tmk0MU56a3hMVFE0TGpNeU5Dd3dMVGczTGpVc016a3VNVGMwT0MwNE55NDFMRGczTGpVd01ERjJNakkxTGpNeU9XTXdMREUwTGpBNE15d3hNUzQwTVRjc01qVXVOU3d5TlM0MUxESTFMalZ6TWpVdU5TMHhNUzQwTVRjc01qVXVOUzB5TlM0MVl6QXROQzQ1TnpJdExqYzFOUzA1TGpJeU1TMHlMakUzTFRFekxqUXpNaTB5TGpNME1TMDFMall5TVMwekxqVTVNUzB4TVM0NE5UUXRNeTQxT1RFdE1UZ3VNVGd5WXpBdE1qZ3VORFV5TERFM0xqTTFPUzAxTUM0NU5UVXNOREl1T1RNNUxUVXdMamsxTldNeE55NDNNRFlzTUN3MU5DNDJOamdzTVRRdU5UTTJMRFUwTGpZM05pdzNOaTR6TVRsRE5Ea3dMamcyTlN3ME1qY3VOVEVzTkRJeUxqY3dOQ3cwTmpFc016Y3pMalVzTkRZeFl5MDFPQzQ0Tmpjc01DMHhNVE11T0MwME55NHlOQzB4TVRNdU9DMHhNVGN1TlRnell6QXROUzR6T0RRdU9EQXhMVEV5TGpRek1pd3hMak15TWkweU1DNHhOREluSUhSeVlXNXpabTl5YlQwbmJXRjBjbWw0S0M0eE9ETTJOVFVnTUNBd0lEQXVNVGd6TmpVMUlETXdOQzQ1TURRNE5UZ2dNamt6TGpNME1UWTNNeWtuSUdacGJHdzlKMjV2Ym1VbklITjBjbTlyWlQwbkkyWm1aaWNnYzNSeWIydGxMWGRwWkhSb1BTY3lNUzQyTnpBekp5QnpkSEp2YTJVdGJHbHVaV05oY0QwbmNtOTFibVFuSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBuY205MWJtUW5MejQ4TDJjK1BIUmxlSFFnWkhnOUp6QW5JR1I1UFNjd0p5Qm1iMjUwTFdaaGJXbHNlVDBuVkdGb2IyMWhKeUJtYjI1MExYTnBlbVU5SnpRd0p5Qm1iMjUwTFhkbGFXZG9kRDBuTkRBd0p5QjBjbUZ1YzJadmNtMDlKM1J5WVc1emJHRjBaU2d4TVRndU9EVTBNVFkzSURFek1pNHlNRE14TlRrcEp5Qm1hV3hzUFNjalptWm1aV1psSnlCemRISnZhMlV0ZDJsa2RHZzlKekFuUGp4MGMzQmhiaUI1UFNjd0p5Qm1iMjUwTFhkbGFXZG9kRDBuTkRBd0p5QnpkSEp2YTJVdGQybGtkR2c5SnpBblBqd2hXME5FUVZSQlcxVnVhWFI1SUVOeWVYQjBieUJIYVdaMElFTmhjbVJkWFQ0OEwzUnpjR0Z1UGp3dmRHVjRkRDQ4ZEdWNGRDQmtlRDBuTUNjZ1pIazlKekFuSUdadmJuUXRabUZ0YVd4NVBTZFVZV2h2YldFbklHWnZiblF0YzJsNlpUMG5OakFuSUdadmJuUXRkMlZwWjJoMFBTYzBNREFuSUhSeVlXNXpabTl5YlQwbmRISmhibk5zWVhSbEtERXdPUzQwTWpjMk9UY2dOakV3TGpFeU9ESTJNaWtuSUdacGJHdzlKeU5tWm1ZbklITjBjbTlyWlMxM2FXUjBhRDBuTUNjK1BIUnpjR0Z1SUhrOUp6QW5JR1p2Ym5RdGQyVnBaMmgwUFNjME1EQW5JSE4wY205clpTMTNhV1IwYUQwbk1DYytSMjl2WkNCS2IySThMM1J6Y0dGdVBqd3ZkR1Y0ZEQ0OGRHVjRkQ0JrZUQwbk1DY2daSGs5SnpBbklHWnZiblF0Wm1GdGFXeDVQU2RVWVdodmJXRW5JR1p2Ym5RdGMybDZaVDBuTkRjdU9UYzFKeUJtYjI1MExYZGxhV2RvZEQwbk5EQXdKeUIwY21GdWMyWnZjbTA5SjNSeVlXNXpiR0YwWlNneE1UWXVNVGc1T1RVeElERTVPUzQxTVRnM09Ta25JR1pwYkd3OUp5Tm1abVluSUhOMGNtOXJaUzEzYVdSMGFEMG5NQ2MrUEhSemNHRnVJSGs5SnpBbklHWnZiblF0ZDJWcFoyaDBQU2MwTURBbklITjBjbTlyWlMxM2FXUjBhRDBuTUNjK05EQWdWVk5FUEM5MGMzQmhiajQ4TDNSbGVIUStQQzl6ZG1jKyJ9"
                  assert.equal(tokenUri, expectedTokenUri)
                  tokenId++
              })

              it("nft value is added to the contract balance", async function () {
                  const [deployer] = await ethers.getSigners()
                  const currentBalance = await giftCard.provider.getBalance(giftCard.address)
                  const sentValue = ethers.utils.parseEther("0.02")
                  const nft = await giftCard.safeMint(deployer.address, "Great Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  const afterBalance = await giftCard.provider.getBalance(giftCard.address)
                  assert.equal(afterBalance.toString(), currentBalance.add(sentValue).toString())
                  tokenId++
              })

              it("mints NFT and triggers GiftCardMinted event when all params are sent", async function () {
                  const [deployer] = await ethers.getSigners()
                  await expect(
                      giftCard.safeMint(deployer.address, "Happy Birthday", {
                          value: ethers.utils.parseEther("0.05"),
                      })
                  ).to.be.emit(giftCard, "GiftCardMinted")
                  tokenId++
              })
          })

          describe("Redeeming a GiftCard NFT", async function () {
              it("fails if redeemer is not owner or approved", async function () {
                  const [deployer, owner] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.04")
                  const nft = await giftCard.safeMint(owner.address, "Nice Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  await expect(giftCard.redeem(tokenId.toString())).to.be.revertedWithCustomError(
                      giftCard,
                      "GiftCard__OnlyOwnerOfNFT"
                  )
                  tokenId++
              })
              it("transfers correct value from contract to owner on redeem", async function () {
                  const [deployer] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.04")
                  const nft = await giftCard.safeMint(deployer.address, "Nice Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  const ownerCurrentBalance = await ethers.provider.getBalance(deployer.address)
                  const contractCurrentBalance = await ethers.provider.getBalance(giftCard.address)
                  const redeem = await giftCard.redeem(tokenId.toString())
                  const tx = await redeem.wait(1)
                  const { gasUsed, effectiveGasPrice } = tx
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const ownerAfterBalance = await ethers.provider.getBalance(deployer.address)
                  const contractAfterBalance = await ethers.provider.getBalance(giftCard.address)
                  assert.equal(
                      contractAfterBalance.toString(),
                      contractCurrentBalance.sub(sentValue).toString()
                  )
                  assert.equal(
                      ownerAfterBalance.add(gasCost).toString(),
                      ownerCurrentBalance.add(sentValue).toString()
                  )
                  tokenId++
              })
              it("emits GiftCardRedeemed after redeem", async function () {
                  const [deployer] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.04")
                  const nft = await giftCard.safeMint(deployer.address, "Nice Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  await expect(giftCard.redeem(tokenId.toString())).to.emit(
                      giftCard,
                      "GiftCardRedeemed"
                  )
                  tokenId++
              })
              it("token is burned after redeem", async function () {
                  const [deployer] = await ethers.getSigners()
                  const sentValue = ethers.utils.parseEther("0.04")
                  const nft = await giftCard.safeMint(deployer.address, "Nice Job", {
                      value: sentValue,
                  })
                  await nft.wait(1)
                  await giftCard.redeem(tokenId.toString())
                  await expect(giftCard.tokenURI(tokenId.toString())).to.be.reverted
                  tokenId++
              })
          })
      })
