// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment the line to use openzeppelin/ERC721,ERC20
// You can use this dependency directly because it has been installed by TA already
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./MyERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BuyMyRoom is ERC721 {

    // use a event if you want
    // to represent time you can choose block.timestamp
    event HouseListed(uint256 tokenId, uint256 price, address owner);
    event HouseSold(uint256 tokenId, uint256 price, address newOwner);

    // maybe you need a struct to store car information
    struct House {
        uint256 listedTimestamp;
        uint256 price;
        bool selling;
        string discription;
    }
    struct HouseInfo {
        uint256 id;
        uint256 listedTimestamp;
        uint256 price;
        string owner;
        bool selling;
        string discription;
    }
    mapping (uint256 => House) public house_;
    // House[] house_;

    uint256 index_counter;
    address mannager;
    uint256 fee;   // 
    MyERC20 myPoints ;

    // ...
    // TODO add any variables and functions if you want
    constructor(address myPoints_, uint256 fee_) ERC721("HNFT", "HN"){
        index_counter = 0;
        mannager = msg.sender;
        myPoints = MyERC20(myPoints_);
        fee = fee_;
    }

    function releaseNewHouse() external {
        _mint(msg.sender, index_counter);
        // house_[index_counter].listedTimestamp = block.timestamp;
        house_[index_counter].selling = false;
        house_[index_counter].discription = Strings.toString(index_counter);
        index_counter++;
    }

    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    function getHouses() external view returns (HouseInfo[] memory) {
        uint256 cnt = 0;
        uint256 houseCount = balanceOf(msg.sender);
        HouseInfo[] memory result = new HouseInfo[](houseCount);
        for(uint256 i = 0; i < index_counter; i++) {
            if (ownerOf(i) == msg.sender) {
                result[cnt].id = i;
                address addr = ownerOf(i);
                result[cnt].owner = toString(addr);
                result[cnt].listedTimestamp = house_[i].listedTimestamp;
                result[cnt].price = house_[i].price;
                result[cnt].selling = house_[i].selling;
                result[cnt].discription = house_[i].discription;
                cnt++;
            }
        }
        return result;
    }


    function getAllHouse() external view returns (HouseInfo[] memory) {
        uint256 cnt = 0;
        for(uint256 i = 0; i < index_counter; i++) {
            if (house_[i].selling) {
                cnt++;
            }
        }
        HouseInfo[] memory result = new HouseInfo[](cnt);
        cnt = 0;
        for(uint256 i = 0; i < index_counter; i++) {
            if (house_[i].selling) {
                result[cnt].id = i;
                address addr = ownerOf(i);
                result[cnt].owner = toString(addr);
                result[cnt].listedTimestamp = house_[i].listedTimestamp;
                result[cnt].price = house_[i].price;
                result[cnt].selling = house_[i].selling;
                result[cnt].discription = house_[i].discription;
                cnt++;
            }
        }
        return result;
    }

    function listHouse(uint256 tokenID, uint256 price) external {
        require(ownerOf(tokenID) == msg.sender);
        require(!house_[tokenID].selling);
        house_[tokenID].price = price;
        house_[tokenID].selling = true;
        house_[tokenID].listedTimestamp = block.timestamp;
        // emit HouseListed(tokenID, price, msg.sender);
    }

    function getHousePrice(uint256 tokenID) external view returns (uint256){
        return house_[tokenID].price;
    }

    function getHouseDiscription(uint256 tokenID) external view returns (string memory){
        return house_[tokenID].discription;
    }


    function getHouseOwner(uint256 tokenID) external view returns (address){
        return ownerOf(tokenID);
    }

    function getHouseListedTimeStamp(uint256 tokenID) external view returns (uint256){
        return house_[tokenID].listedTimestamp;
    }

    function getSellingFee(uint256 tokenID) external view returns (uint256){
        require(house_[tokenID].selling);
        uint256 housePrice = house_[tokenID].price;
        uint256 feePrice = (block.timestamp - house_[tokenID].listedTimestamp) * fee * housePrice / (10 ** 6);
        return feePrice;
    }

    function buyHouse(uint256 tokenID) external {
        require(house_[tokenID].selling);
        address seller = ownerOf(tokenID);
        uint256 housePrice = house_[tokenID].price;
        uint256 feePrice = (block.timestamp - house_[tokenID].listedTimestamp) * fee * housePrice / (10 ** 6);
        uint256 sellerPrice = housePrice - feePrice;
        require(myPoints.balanceOf(msg.sender) >= housePrice);
        myPoints.transferFrom(msg.sender, seller, sellerPrice);
        myPoints.transferFrom(msg.sender, mannager, feePrice);
        house_[tokenID].selling = false;
        _transfer(seller, msg.sender, tokenID);
        emit Transfer(seller, msg.sender, tokenID);
    }
}