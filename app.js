// Contract info
const contractAddress = "0xF99De89c3c4d6D7629A62095EC7A1610AA5e08f0"; // Replace with your deployed contract address

// ABI for the Real Estate Valuation contract
const contractABI = [
  {
    "inputs": [{"internalType": "string", "name": "_zipCode", "type": "string"}],
    "name": "requestSmartZipValue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_zipCode", "type": "string"}],
    "name": "requestProspectNowValue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "averageValue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "smartZipValue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "prospectNowValue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawLink",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "SmartZipValueUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "ProspectNowValueUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "AverageValueUpdated",
    "type": "event"
  }
];

let web3;
let realEstateContract;
let currentAccount;

// Initialize web3 connection
async function initWeb3() {
  // Check if MetaMask is installed
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      currentAccount = accounts[0];
      console.log("Connected to account:", currentAccount);
      
      // Initialize the contract
      realEstateContract = new web3.eth.Contract(contractABI, contractAddress);
      
      // Set up event listeners for valuation updates
      setupEventListeners();
      
      // Update the UI with a success message
      const container = document.querySelector('.container');
      const statusDiv = document.createElement('div');
      statusDiv.id = 'status';
      statusDiv.style.color = 'green';
      statusDiv.textContent = 'Connected to Ethereum network';
      container.appendChild(statusDiv);
      
      // Add a results section to the UI
      const resultsDiv = document.createElement('div');
      resultsDiv.id = 'results';
      resultsDiv.innerHTML = `
        <h2>Property Valuation Results</h2>
        <p>SmartZip Value: <span id="smartzip-value">Not available yet</span></p>
        <p>ProspectNow Value: <span id="prospectnow-value">Not available yet</span></p>
        <p>Average Value: <span id="average-value">Not available yet</span></p>
      `;
      container.appendChild(resultsDiv);
      
    } catch (error) {
      console.error("User denied account access:", error);
      const container = document.querySelector('.container');
      const statusDiv = document.createElement('div');
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Error: MetaMask account access denied';
      container.appendChild(statusDiv);
    }
  } else {
    console.error("No Ethereum browser extension detected");
    const container = document.querySelector('.container');
    const statusDiv = document.createElement('div');
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Error: Please install MetaMask to use this application';
    container.appendChild(statusDiv);
  }
}

// Set up event listeners for the contract
function setupEventListeners() {
  realEstateContract.events.SmartZipValueUpdated()
    .on('data', (event) => {
      const value = event.returnValues.value;
      document.getElementById('smartzip-value').textContent = `$${formatDollarAmount(value)}`;
      updateStatus(`SmartZip valuation received: $${formatDollarAmount(value)}`);
    })
    .on('error', console.error);
  
  realEstateContract.events.ProspectNowValueUpdated()
    .on('data', (event) => {
      const value = event.returnValues.value;
      document.getElementById('prospectnow-value').textContent = `$${formatDollarAmount(value)}`;
      updateStatus(`ProspectNow valuation received: $${formatDollarAmount(value)}`);
    })
    .on('error', console.error);
  
  realEstateContract.events.AverageValueUpdated()
    .on('data', (event) => {
      const value = event.returnValues.value;
      document.getElementById('average-value').textContent = `$${formatDollarAmount(value)}`;
      updateStatus(`Average valuation calculated: $${formatDollarAmount(value)}`);
    })
    .on('error', console.error);
}

// Function to request SmartZip valuation
async function requestSmartZipValue() {
  if (!realEstateContract) {
    alert("Please wait for blockchain connection to initialize");
    return;
  }
  
  const zipCode = document.getElementById("zip-code").value;
  if (!zipCode) {
    alert("Please enter a ZIP code");
    return;
  }
  
  try {
    updateStatus(`Requesting SmartZip valuation for ZIP code ${zipCode}...`);
    
    const tx = await realEstateContract.methods.requestSmartZipValue(zipCode).send({
      from: currentAccount
    });
    
    updateStatus(`Request sent. Transaction hash: ${tx.transactionHash}`);
    
  } catch (error) {
    console.error("Error requesting SmartZip value:", error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Function to request ProspectNow valuation and calculate average
async function getAverageValue() {
  if (!realEstateContract) {
    alert("Please wait for blockchain connection to initialize");
    return;
  }
  
  const zipCode = document.getElementById("zip-code").value;
  if (!zipCode) {
    alert("Please enter a ZIP code");
    return;
  }
  
  try {
    updateStatus(`Requesting ProspectNow valuation for ZIP code ${zipCode}...`);
    
    const tx = await realEstateContract.methods.requestProspectNowValue(zipCode).send({
      from: currentAccount
    });
    
    updateStatus(`Request sent. Transaction hash: ${tx.transactionHash}`);
    updateStatus(`Waiting for oracle responses to calculate average...`);
    
  } catch (error) {
    console.error("Error requesting ProspectNow value:", error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Function to withdraw LINK tokens
async function withdrawLink() {
  if (!realEstateContract) {
    alert("Please wait for blockchain connection to initialize");
    return;
  }
  
  try {
    updateStatus(`Withdrawing remaining LINK tokens...`);
    
    const tx = await realEstateContract.methods.withdrawLink().send({
      from: currentAccount
    });
    
    updateStatus(`Withdrawal complete. Transaction hash: ${tx.transactionHash}`);
    
  } catch (error) {
    console.error("Error withdrawing LINK:", error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Helper function to update status
function updateStatus(message, isError = false) {
  let statusDiv = document.getElementById('status');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    document.querySelector('.container').appendChild(statusDiv);
  }
  
  const statusMessage = document.createElement('p');
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? 'red' : 'green';
  statusDiv.appendChild(statusMessage);
  
  // Scroll to the bottom of the status div
  statusDiv.scrollTop = statusDiv.scrollHeight;
}

// Helper function to format dollar amounts
function formatDollarAmount(value) {
  return parseInt(value).toLocaleString('en-US');
}

// Initialize when the page loads
window.addEventListener('load', initWeb3);
