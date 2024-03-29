pragma solidity ^0.4.24;

import "../coffeeaccesscontrol/RetailerRole.sol";
import "../coffeeaccesscontrol/ConsumerRole.sol";

// Define a contract 'Supplychain'
contract SupplyChain {

  // Define 'owner'
  address owner;

  // Define a variable called 'upc' for Universal Product Code (UPC)
  uint  upc;

  // Define a variable called 'sku' for Stock Keeping Unit (SKU)
  uint  sku;
  
  // Define enum 'State' with the following values:
  enum State { 
    Harvested,  // 0
    Processed,  // 1
    Packed,     // 2
    ForSale,    // 3
    Sold,       // 4
    Shipped,    // 5
    Received,   // 6
    Purchased   // 7
  }

  State constant defaultState = State.Harvested;

  // Define a struct 'Item' with the following fields:
  struct Item {
    uint    sku;  // Stock Keeping Unit (SKU)
    uint    upc; // Universal Product Code (UPC), generated by the Farmer, goes on the package, can be verified by the Consumer
    address ownerID;  // Metamask-Ethereum address of the current owner as the product moves through 8 stages
    address originFarmerID; // Metamask-Ethereum address of the Farmer
    string  originFarmName; // Farmer Name
    string  originFarmInformation;  // Farmer Information
    string  originFarmLatitude; // Farm Latitude
    string  originFarmLongitude;  // Farm Longitude
    uint    productID;  // Product ID potentially a combination of upc + sku
    string  productNotes; // Product Notes
    uint    productPrice; // Product Price
    State   itemState;  // Product State as represented in the enum above
    address distributorID;  // Metamask-Ethereum address of the Distributor
    address retailerID; // Metamask-Ethereum address of the Retailer
    address consumerID; // Metamask-Ethereum address of the Consumer
  }

  // Define a public mapping 'items' that maps the UPC to an Item.
  mapping (uint => Item) items;

  RetailerRole retailer_role = new RetailerRole();
  ConsumerRole consumer_role = new ConsumerRole();

  // Define a public mapping 'itemsHistory' that maps the UPC to an array of TxHash, 
  // that track its journey through the supply chain -- to be sent from DApp.
  // Not used in DApp; Instead, used events
//  mapping (uint => string[]) itemsHistory;

  // Define 8 events with the same 8 state values and accept 'upc' as input argument
  event Harvested(uint upc);
  event Processed(uint upc);
  event Packed(uint upc);
  event ForSale(uint upc);
  event Sold(uint upc);
  event Shipped(uint upc);
  event Received(uint upc);
  event Purchased(uint upc);

  // Define a modifer that checks to see if msg.sender == owner of the contract
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  // Define a modifer that verifies the Caller
  modifier verifyCaller(address _address) {
    require(msg.sender == _address); 
    _;
  }

  // Define a modifier that checks if the paid amount is sufficient to cover the price
  modifier paidEnough(uint _upc) { 
    uint _price = items[_upc].productPrice;
    require(msg.value >= _price); 
    _;
  }
  
  // Define a modifier that checks the price and refunds the remaining balance
  modifier checkValue(uint _upc) {
    uint _price = items[_upc].productPrice;
    uint amountToReturn = msg.value - _price;
    if(amountToReturn > 0) {
        msg.sender.transfer(amountToReturn);
    }
//    items[_upc].consumerID.transfer(amountToReturn);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is Harvested
  modifier harvested(uint _upc) {
    require(items[_upc].itemState == State.Harvested);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is Processed
  modifier processed(uint _upc) {
    require(items[_upc].itemState == State.Processed);
    _;
  }
  
  // Define a modifier that checks if an item.state of a upc is Packed
  modifier packed(uint _upc) {
    require(items[_upc].itemState == State.Packed);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is ForSale
  modifier forSale(uint _upc) {
    require(items[_upc].itemState == State.ForSale);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is Sold
  modifier sold(uint _upc) {
    require(items[_upc].itemState == State.Sold);
    _;
  }
  
  // Define a modifier that checks if an item.state of a upc is Shipped
  modifier shipped(uint _upc) {
    require(items[_upc].itemState == State.Shipped);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is Received
  modifier received(uint _upc) {
    require(items[_upc].itemState == State.Received);
    _;
  }

  // Define a modifier that checks if an item.state of a upc is Purchased
  modifier purchased(uint _upc) {
    require(items[_upc].itemState == State.Purchased);    
    _;
  }

  // In the constructor set 'owner' to the address that instantiated the contract
  // and set 'sku' to 1
  // and set 'upc' to 1
  constructor() public payable {
    owner = msg.sender;
    sku = 1;
    upc = 1;
  }

  // Define a function 'kill' if required
  function kill() public {
    if (msg.sender == owner) {
      selfdestruct(owner);
    }
  }

  // Define a function 'harvestItem' that allows a farmer to mark an item 'Harvested'
  function harvestItem(uint _upc, address _originFarmerID, string _originFarmName, string _originFarmInformation, 
    string  _originFarmLatitude, string  _originFarmLongitude, string  _productNotes) public {
    // Add the new item as part of Harvest
    items[_upc] = Item({sku:sku, upc:_upc, ownerID:msg.sender, originFarmerID:_originFarmerID, 
                    originFarmName:_originFarmName, originFarmInformation:_originFarmInformation,
                    originFarmLatitude:_originFarmLatitude, originFarmLongitude:_originFarmLongitude,
                    productID:_upc, productNotes:_productNotes, itemState:State.Harvested,
                    productPrice:0, distributorID:0, retailerID:0, consumerID:0});
    // Increment sku
    sku = sku + 1;
    emit Harvested(_upc);    
  }

  // Define a function 'processtItem' that allows a farmer to mark an item 'Processed'
  function processItem(uint _upc) public harvested(_upc) verifyCaller(items[_upc].originFarmerID) {
    items[_upc].itemState = State.Processed;
    
    emit Processed(_upc);
    
  }

  // Define a function 'packItem' that allows a farmer to mark an item 'Packed'
  function packItem(uint _upc) public processed(_upc) verifyCaller(items[_upc].originFarmerID) {
    items[_upc].itemState = State.Packed;
    
    emit Packed(_upc);    
  }

  // Define a function 'sellItem' that allows a farmer to mark an item 'ForSale'
  function sellItem(uint _upc, uint _price) public packed(_upc) verifyCaller(items[_upc].originFarmerID) {
    items[_upc].itemState = State.ForSale;
    items[_upc].productPrice = _price;

    emit ForSale(_upc);    
  }

  // Define a function 'buyItem' that allows the disributor to mark an item 'Sold'
  function buyItem(uint _upc) public payable forSale(_upc) paidEnough(_upc) checkValue(_upc) {
    
    // Update the appropriate fields - ownerID, distributorID, itemState
    items[_upc].ownerID = msg.sender;
    items[_upc].distributorID = msg.sender;
    items[_upc].itemState = State.Sold;
    // Transfer money to farmer
    items[_upc].originFarmerID.transfer(items[_upc].productPrice);
    
    emit Sold(_upc);
  }

  // Define a function 'shipItem' that allows the distributor to mark an item 'Shipped'
  function shipItem(uint _upc) public sold(_upc) verifyCaller(items[_upc].distributorID) {
    items[_upc].itemState = State.Shipped;
    
    emit Shipped(_upc);   
  }

  // Define a function 'receiveItem' that allows the retailer to mark an item 'Received'
  function receiveItem(uint _upc) public shipped(_upc) {

    retailer_role.addRetailer(msg.sender);
    require(retailer_role.isRetailer(msg.sender), "caller is not retailer");

    items[_upc].ownerID = msg.sender;
    items[_upc].retailerID = msg.sender;
    items[_upc].itemState = State.Received;
    
    emit Received(_upc);  
  }

  // Define a function 'purchaseItem' that allows the consumer to mark an item 'Purchased'
  function purchaseItem(uint _upc) public received(_upc) {

    consumer_role.addConsumer(msg.sender);
    require(consumer_role.isConsumer(msg.sender), "caller is not consumer");

    items[_upc].ownerID = msg.sender;
    items[_upc].consumerID = msg.sender;
    items[_upc].itemState = State.Purchased;
    
    emit Purchased(_upc);  
  }

  // Define a function 'fetchItemFarmDetails' that fetches the data
  function fetchItemFarmDetails(uint _upc) public view returns 
  (
  uint    itemSKU,
  uint    itemUPC,
  address ownerID,
  address originFarmerID,
  string  originFarmName,
  string  originFarmInformation,
  string  originFarmLatitude,
  string  originFarmLongitude
  ) 
  {
    itemSKU = items[_upc].sku;
    itemUPC = items[_upc].upc;
    ownerID = items[_upc].ownerID;
    originFarmerID = items[_upc].originFarmerID;
    originFarmName = items[_upc].originFarmName;
    originFarmInformation = items[_upc].originFarmInformation;
    originFarmLatitude = items[_upc].originFarmLatitude;
    originFarmLongitude = items[_upc].originFarmLongitude;
  
    return 
    (
      itemSKU,
      itemUPC,
      ownerID,
      originFarmerID,
      originFarmName,
      originFarmInformation,
      originFarmLatitude,
      originFarmLongitude
    );
  }

  // Define a function 'fetchItemProductDetails' that fetches the data
  function fetchItemProductDetails(uint _upc) public view returns 
  (
  uint    itemSKU,
  uint    itemUPC,
  uint    productID,
  string  productNotes,
  uint    productPrice,
  uint    itemState,
  address distributorID,
  address retailerID,
  address consumerID
  ) 
  {
    // Assign values to the 9 parameters
    itemSKU = items[_upc].sku;
    itemUPC = items[_upc].upc;
    productID = items[_upc].productID;
    productNotes = items[_upc].productNotes;
    productPrice = items[_upc].productPrice;
    itemState = uint(items[_upc].itemState);
    distributorID = items[_upc].distributorID;
    retailerID = items[_upc].retailerID;
    consumerID = items[_upc].consumerID;
    
    return 
    (
    itemSKU,
    itemUPC,
    productID,
    productNotes,
    productPrice,
    itemState,
    distributorID,
    retailerID,
    consumerID
    );
  }

}
