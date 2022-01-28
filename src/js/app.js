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

        App.initTest();

        return App.initSupplyChain();
    },

    initTest: function() {
        console.log("Testing init");
        var jsonTestProduct='../../build/contracts/TestProduct.json';
        
        // get contract instance
        $.getJSON(jsonTestProduct, function(data) {
            console.log('data',data);
            var TestProductArtifact = data;
            const deployedNetwork = TestProductArtifact.networks[App.networkId];
            App.contracts.TestProduct2 = new web3.eth.Contract(
                TestProductArtifact.abi,
                deployedNetwork.address,
            );
        });

        return App.bindEvents();
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
            
//            App.fetchItemFarmDetails();
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
                return await App.fetchItemFarmDetails(event);
                break;
            case 10:
                return await App.fetchItemProductDetails(event);
                break;
            case 91:
                return await App.testProductGet(event);
                break;
            case 92:
                return await App.testProductUpdate(event);
                break;
            }
    },

    testProduct: function(event) {

        console.log("entered testProduct function");
        App.contracts.TestProduct.deployed().then(function(instance) {
            console.log("entered testProduct contract");
            return instance.getName();
        }).then(function(result) {
            $("#ownerID").text(result);
            console.log('Name = ', result);
        }).catch(function(err) {
            console.log(err.message);
        });  
    },

    testProductGet: async function(event) {
        console.log("into test product get function");

        const { name } = App.contracts.TestProduct2.methods;
        const response = await name().call();

        $("#name").val(response);
        console.log("Response = ", response);
    },

    testProductUpdate: async function(event) {
        console.log("into test product update function");
        const { setName } = App.contracts.TestProduct2.methods;
        const response = await setName($("#name").val()).send({from: App.metamaskAccountID});

        console.log("Response = ", response);
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
        
        console.log('Harvest Item Response:', response);
    },

    processItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.processItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('processItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },
    
    packItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.packItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('packItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    sellItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const productPrice = web3.toWei(1, "ether");
            console.log('productPrice',productPrice);
            return instance.sellItem(App.upc, App.productPrice, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('sellItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    buyItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.buyItem(App.upc, {from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('buyItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    shipItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.shipItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('shipItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    receiveItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.receiveItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('receiveItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    purchaseItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.purchaseItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('purchaseItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
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
        console.log("Farm Details = ", response);
    },

    fetchItemProductDetails: async function () {
        App.upc = $('#upc').val();
        console.log('upc',App.upc);

        const { fetchItemProductDetails } = App.contracts.SupplyChain.methods;
        const response = await fetchItemProductDetails(App.upc).call();

        $("#sku").val(response.itemSKU);
        $("#productNotes").val(response.productNotes);
        $("#productPrice").val(response.productPrice);
        $("#distributorID").val(response.distributorID);
        $("#retailerID").val(response.retailerID);
        $("#consumerID").val(response.consumerID);
        console.log("Product Details = ", response);
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                App.contracts.SupplyChain.currentProvider,
                    arguments
              );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
        var events = instance.allEvents(function(err, log){
          if (!err)
            $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
        });
        }).catch(function(err) {
          console.log(err.message);
        });
        
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
