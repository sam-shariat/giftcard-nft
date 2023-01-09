// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./PriceConsumerV3.sol";
import {Base64} from "./libraries/Base64.sol";

error GiftCard__NotEnoughETH();
error GiftCard__OnlyOwnerOfNFT();
error GiftCard__RedeemTransferFailed();
error GiftCard__TextIsEmpty();
error GiftCard__NoAddress();

/// @custom:security-contact samshariat7@gmail.com
/**
 * @title GiftCardNFT
 * @author SamyWalters
 * @notice GiftCard is an NFT based contract that will mint a fancy on-chain GiftCard NFT with an optional value > 0
 * @dev SVG of the GiftCard will contain a custom text and the value of the GiftCard in usd ( using chainlink oracles )
 * the GiftCard can be redeemed anytime by the owner and the value will be withdrawn to the owner of the NFT
 * the redeemed NFT will be burned after the value is withdrawn to the owner*/

contract GiftCard is
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    PriceConsumerV3
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    string private constant SVG_PART_ONE =
        "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' id='evKbyYkUTOd1' viewBox='0 0 1200 719' shape-rendering='geometricPrecision' text-rendering='geometricPrecision' style='background-color:#111'><rect width='1200.878676' height='264.338235' rx='0' ry='0' transform='matrix(1.18412-.158493 0.230223 1.720027-202.277452 504.012004)' fill='#151515' stroke-width='0'/><rect width='1200.878676' height='264.338235' rx='0' ry='0' transform='matrix(1.188377-.122561 0.178029 1.72621-157.078064 507.438426)' fill='#222' stroke-width='0'/><rect width='1200.878676' height='264.338235' rx='0' ry='0' transform='matrix(1.191742-.083735 0.121631 1.731098-121.64459 513.479528)' fill='#252525' stroke-width='0'/><rect width='199.134804' height='146.267157' rx='73.13' ry='73.13' transform='matrix(.774232 0 0 1 923.344329 80)' fill='#333' stroke-width='0' stroke-linecap='round' stroke-linejoin='round'/><g transform='matrix(1 0 0-1 626.932613 512.469013)'><path d='M250.666,118.605C166.63,137.862,78.851,210.722,78.833,339.25C78.8065,528.227,227.362,641,373.5,641c161.141,0,296.096-126.56,296.125-301.75C669.659,132.127,483.711,76.4209,435.5,76.4209c-24.162,0-43.75,19.5879-43.75,43.7501c0,22.613,17.323,41.424,39.729,43.307c66.789,7.473,149.379,61.737,149.396,175.772C580.895,477.086,472.596,551,373.5,551c-81.2,0-202.976-59.138-203-211.75C170.485,243.715,251.171,205,311,205h100c69.977,2.475,125.487,54.465,125.5,134.25.018,113.979-89.818,166.75-163,166.75-63.193,0-157.962-45.373-157.982-166.75-.008-48.784,28.406-64.674,47.343-64.674c25.33,0,41.502,24.564,41.502,46.894c0,16.052-.445,21.656-.197,27.096C306.025,386.372,336.209,416,373.5,416c42.863,0,71.687-35.591,71.687-70.5c0-11.79-1.748-22.745-6.275-33.046M435.5,120.171c84.252,8.943,189.729,77.722,189.75,219.079C625.275,505.57,493.263,596,373.5,596c-138.204,0-248.81-109.425-248.834-256.75-.018-112.362,82.547-161.619,137.044-174.713c21.57-4.096,37.623-23.346,37.623-45.932c0-26.8784-21.789-48.6655-48.666-48.6655C207.376,69.9395,33,143.502,33,339.25C33,552.178,201,686,373.5,686C563.323,686,713.968,534.805,714,339.25c.038-234.833-210.446-306.5791-278.5-306.5791-48.324,0-87.5,39.1748-87.5,87.5001v225.329c0,14.083,11.417,25.5,25.5,25.5s25.5-11.417,25.5-25.5c0-4.972-.755-9.221-2.17-13.432-2.341-5.621-3.591-11.854-3.591-18.182c0-28.452,17.359-50.955,42.939-50.955c17.706,0,54.668,14.536,54.676,76.319C490.865,427.51,422.704,461,373.5,461c-58.867,0-113.8-47.24-113.8-117.583c0-5.384.801-12.432,1.322-20.142' transform='matrix(.183655 0 0 0.183655 304.904858 293.341673)' fill='none' stroke='#fff' stroke-width='21.6703' stroke-linecap='round' stroke-linejoin='round'/></g><text dx='0' dy='0' font-family='Tahoma' font-size='40' font-weight='400' transform='translate(118.854167 132.203159)' fill='#fffefe' stroke-width='0'><tspan y='0' font-weight='400' stroke-width='0'><![CDATA[Unity Crypto Gift Card]]></tspan></text><text dx='0' dy='0' font-family='Tahoma' font-size='60' font-weight='400' transform='translate(109.427697 610.128262)' fill='#fff' stroke-width='0'><tspan y='0' font-weight='400' stroke-width='0'>";
    string private constant SVG_PART_TWO =
        "</tspan></text><text dx='0' dy='0' font-family='Tahoma' font-size='47.975' font-weight='400' transform='translate(116.189951 199.51879)' fill='#fff' stroke-width='0'><tspan y='0' font-weight='400' stroke-width='0'>";
    mapping(uint256 => uint256) private _values;

    event GiftCardRedeemed(
        uint256 indexed tokenId,
        address indexed destination,
        uint256 indexed value
    );

    event GiftCardMinted(
        uint256 indexed tokenId,
        address indexed destination,
        uint256 indexed value
    );

    /**
     * @param priceFeedAddress is the chainlink Aggregator: ETH/USD Pricefeed Contract Address that will be used for getting the latest price of ETH
     */
    constructor(
        address priceFeedAddress
    ) ERC721("GiftCardNFT", "GCN") PriceConsumerV3(priceFeedAddress) {}

    /**
     * @notice safeMint mints an NFT and transfers it to the "to" param
     * @param to is the address that will own the NFT
     * @param text is the string that will be in the NFT image */

    function safeMint(address to, string memory text) public payable onlyOwner {
        // reverting when there is no money sent
        bytes memory textString = bytes(text);
        if (textString.length == 0) {
            revert GiftCard__TextIsEmpty();
        }
        if (msg.value == 0) {
            revert GiftCard__NotEnoughETH();
        }

        uint256 tokenId = _tokenIdCounter.current();
        // Getting the latest price of ETH using Chainlink Price Feed
        uint256 ethPrice = PriceConsumerV3.getLatestPrice();
        // Converting the value from ETH to USD
        uint256 ethAmountInUsd = ((ethPrice * msg.value) /
            1000000000000000000) / 100000000;
        string memory _value = Strings.toString(ethAmountInUsd);
        // combining the final SVG Image
        string memory finalSvg = string(
            abi.encodePacked(
                SVG_PART_ONE,
                text,
                SVG_PART_TWO,
                _value,
                " USD</tspan></text></svg>"
            )
        );
        string memory name = string(abi.encodePacked(text));
        string memory description = string(
            abi.encodePacked("Unity ", _value, " USD Gift Card")
        );
        // Creating the json forthe token uri of the NFT
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        name,
                        '", "description": "',
                        description,
                        '", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSvg)),
                        '"}'
                    )
                )
            )
        );

        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        _values[tokenId] = msg.value;
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, finalTokenUri);
        emit GiftCardMinted(tokenId, to, msg.value);
    }

    /** @notice Transfers the value of the NFT to the current owner and then will burn the NFT */
    function redeem(uint256 tokenId) public {
        uint256 value = _values[tokenId];
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) {
            revert GiftCard__OnlyOwnerOfNFT();
        }
        address destination = ERC721.ownerOf(tokenId);
        (bool success, ) = destination.call{value: value}("");
        _burn(tokenId);
        delete _values[tokenId];
        emit GiftCardRedeemed(tokenId, destination, value);
    }

    /** @notice deletes NFT
     * @param tokenId - NFT Token Id
     */
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /** @notice Returns token uri of the GiftCardNFT
     *  @param tokenId - NFT Token Id
     *  @return string - token uri of the GiftCardNFT in base64 json
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /** @notice Returns value of the GiftCardNFT
     *  @param tokenId - NFT Token Id
     *  @return uint256 - value of the GiftCardNFT in ETH
     */
    function valueOfGCN(uint256 tokenId) public view returns (uint256) {
        return _values[tokenId];
    }
}
