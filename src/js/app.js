App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0,
    upc: 0,
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originFarmerID: "0x0000000000000000000000000000000000000000",
    originFarmName: null,
    originFarmInformation: null,
    originFarmLatitude: null,
    originFarmLongitude: null,
    productNotes: null,
    productPrice: 0,
    distributorID: "0x0000000000000000000000000000000000000000",
    retailerID: "0x0000000000000000000000000000000000000000",
    consumerID: "0x0000000000000000000000000000000000000000",

    init: async function () {
        App.readForm();
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    state: function(value) {
        switch(value) {
            case 0:
                return "Harvested";
                break;
            case 1:
                return "Processed";
                break;
            case 2:
                return "Packed";
                break;
            case 3:
                return "For Sale";
                break;
            case 4:
                return "Sold";
                break;
            case 5:
                return "Shipped";
                break;
            case 6:
                return "Received";
                break;
            case 7:
                return "Purchased";
                break;
        }
    },

    readForm: function () {
        App.sku = $("#sku").val();
        App.upc = $("#upc").val();
        App.ownerID = $("#ownerID").val();
        App.originFarmerID = $("#originFarmerID").val();
        App.originFarmName = $("#originFarmName").val();
        App.originFarmInformation = $("#originFarmInformation").val();
        App.originFarmLatitude = $("#originFarmLatitude").val();
        App.originFarmLongitude = $("#originFarmLongitude").val();
        App.productNotes = $("#productNotes").val();
        App.productPrice = $("#productPrice").val();
        App.distributorID = $("#distributorID").val();
        App.retailerID = $("#retailerID").val();
        App.consumerID = $("#consumerID").val();

        console.log(
            App.sku,
            App.upc,
            App.ownerID, 
            App.originFarmerID, 
            App.originFarmName, 
            App.originFarmInformation, 
            App.originFarmLatitude, 
            App.originFarmLongitude, 
            App.productNotes, 
            App.productPrice, 
            App.distributorID, 
            App.retailerID, 
            App.consumerID
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        await App.getMetaskAccountID();
        App.networkId = await web3.eth.net.getId();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];
        });

        window.ethereum.on('accountsChanged', function() {
            web3.eth.getAccounts(function(err, res) {
                App.metamaskAccountID = res[0];
                console.log("selected different address", App.metamaskAccountID);
            });
        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='../../build/contracts/SupplyChain.json';
        
        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            console.log('data',data);
            var SupplyChainArtifact = data;

            //App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            //App.contracts.SupplyChain.setProvider(App.web3Provider);

            const deployedNetwork = SupplyChainArtifact.networks[App.networkId];
            App.contracts.SupplyChain = new web3.eth.Contract(
                SupplyChainArtifact.abi,
                deployedNetwork.address,
            );            
        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);

        switch(processId) {
            case 1:
                return await App.harvestItem(event);
                break;
            case 2:
                return await App.processItem(event);
                break;
            case 3:
                return await App.packItem(event);
                break;
            case 4:
                return await App.sellItem(event);
                break;
            case 5:
                return await App.buyItem(event);
                break;
            case 6:
                return await App.shipItem(event);
                break;
            case 7:
                return await App.receiveItem(event);
                break;
            case 8:
                return await App.purchaseItem(event);
                break;
            case 9:
                return await App.fetchItemFarmDetails();
                break;
            case 10:
                return await App.fetchItemProductDetails();
                break;
            case 91:
                return await App.testProductGet(event);
                break;
            case 92:
                return await App.testProductUpdate(event);
                break;
            }
    },
    
    harvestItem: async function(event) {
        App.upc = $('#upc').val();
        App.originFarmName = $('#originFarmName').val();
        App.originFarmInformation = $('#originFarmInformation').val();
        App.originFarmLatitude = $('#originFarmLatitude').val(); 
        App.originFarmLongitude = $('#originFarmLongitude').val(); 
        App.productNotes = $('#productNotes').val();
        
        console.log('Calling Harvest Item:', App);

        const { harvestItem } = App.contracts.SupplyChain.methods;
        const response = await harvestItem(App.upc,
            App.metamaskAccountID, 
            App.originFarmName, 
            App.originFarmInformation, 
            App.originFarmLatitude, 
            App.originFarmLongitude, 
            App.productNotes).send({from: App.metamaskAccountID});
        
            await App.fetchItemFarmDetails();
            console.log('Harvest Item Response:', response);
    },

    processItem: async function (event) {
        const { processItem } = App.contracts.SupplyChain.methods;
        const response = await processItem(App.upc).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Process Item Response:', response);
    },
    
    packItem: async function (event) {
        const { packItem } = App.contracts.SupplyChain.methods;
        const response = await packItem(App.upc).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Pack Item Response:', response);
    },

    sellItem: async function (event) {
        App.productPrice = $("#productPrice").val() * Math.pow(10,18);
        const { sellItem } = App.contracts.SupplyChain.methods;
        const response = await sellItem(App.upc, App.productPrice).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Sell Item Response:', response);
    },

    buyItem: async function (event) {
        App.productPrice = $("#productPrice").val() * Math.pow(10,18);
        const { buyItem } = App.contracts.SupplyChain.methods;
        const response = await buyItem(App.upc).send({from: App.metamaskAccountID, value: App.productPrice})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Buy Item Response:', response);
    },

    shipItem: async function (event) {
        const { shipItem } = App.contracts.SupplyChain.methods;
        const response = await shipItem(App.upc).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Ship Item Response:', response);
    },

    receiveItem: async function (event) {
        const { receiveItem } = App.contracts.SupplyChain.methods;
        const response = await receiveItem(App.upc).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Receive Item Response:', response);
    },

    purchaseItem: async function (event) {
        const { purchaseItem } = App.contracts.SupplyChain.methods;
        const response = await purchaseItem(App.upc).send({from: App.metamaskAccountID})
            .on('error', function(error, receipt) {
                alert(error.message);
            });

        await App.fetchItemFarmDetails();
        console.log('Purchase Item Response:', response);
    },

    fetchItemFarmDetails: async function () {

        App.upc = $('#upc').val();
        console.log('upc',App.upc);

        const { fetchItemFarmDetails } = App.contracts.SupplyChain.methods;
        const response = await fetchItemFarmDetails(App.upc).call();

        $("#sku").val(response.itemSKU);
        $("#ownerID").val(response.ownerID);
        $("#originFarmerID").val(response.originFarmerID);
        $("#originFarmName").val(response.originFarmName);
        $("#originFarmInformation").val(response.originFarmInformation);
        $("#originFarmLatitude").val(response.originFarmLatitude);
        $("#originFarmLongitude").val(response.originFarmLongitude);

        await App.fetchItemProductDetails();
        console.log("Farm Details = ", response);
    },

    fetchItemProductDetails: async function () {
        App.upc = $('#upc').val();
        console.log('upc',App.upc);

        const { fetchItemProductDetails } = App.contracts.SupplyChain.methods;
        const response = await fetchItemProductDetails(App.upc).call();

        $("#sku").val(response.itemSKU);
        $("#productNotes").val(response.productNotes);
        $("#productPrice").val(response.productPrice/Math.pow(10,18));
        $("#itemState").val(App.state(parseInt(response.itemState)));
        $("#distributorID").val(response.distributorID);
        $("#retailerID").val(response.retailerID);
        $("#consumerID").val(response.consumerID);
        console.log("Product Details = ", response);

        App.fetchEvents();
    },

    fetchEvents: function() {
        $("#ftc-events").html("");
        App.contracts.SupplyChain.events.allEvents({
            filter: {},
            fromBlock: 0
        }, function(err, event) {
            if(!err && event.returnValues.upc == App.upc) {
                console.log(event.event, "-", event.transactionHash);
                $("#ftc-events").append('<li>' + event.event + ' - ' + event.transactionHash + '</li>');
            }
            if(err)
                console.log(err.message);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
