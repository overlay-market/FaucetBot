/* eslint-disable no-inline-comments */
const {
    INFURA_URL,
    MOVE_URL,
    BARTIO_URL,
    PRIVATE_KEY,
    FROM_ADDRESS,
    CONTRACT_ADDRESSES,
} = require("../config.json");
const ethers = require("ethers");
const erc20Contract = require("../utils/erc20Contract.js");

let request_queue = [];
startFaucetTask()
async function startFaucetTask() {
    if (request_queue.length > 0) {
        const {
            toAddress,
            amountToken,
            amountEth,
            provider,
            wallet,
            chain,
            resolve,
            reject,
            contractAddress,
            sendEth,
        } = request_queue.shift();
        const block = await provider.getBlock("latest");
        const baseFeePerGas = block.baseFeePerGas || ethers.parseUnits("1", "gwei");
        const maxPriorityFeePerGas = baseFeePerGas + ethers.parseUnits("2", "gwei");
        const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;
        let nonce = await wallet.getNonce("latest");
        const amountTokenInWei = ethers.parseEther(amountToken);
        const amountEthInWei = ethers.parseEther(amountEth);
        try {
            // Initialize the token contract with the correct address for the chain
            const tokenContract = await erc20Contract(wallet, contractAddress);

            console.log("Nonce for OVL transaction: ", nonce);
            // Transfer OVL tokens
            const txToken = await tokenContract.transfer(toAddress, amountTokenInWei, {
                maxPriorityFeePerGas,
                maxFeePerGas,
                nonce,
            });

            let txEth;
            if (sendEth && amountEthInWei > 0n) {
                // Fetch the latest block to get the base fee and set the max fee
                nonce++;

                console.log("Nonce for ETH transaction: ", nonce);
                txEth = await wallet.sendTransaction({
                    to: toAddress,
                    value: amountEthInWei,
                    maxPriorityFeePerGas,
                    maxFeePerGas,
                    nonce,
                });
                await txEth.wait();
            }

            resolve({
                status: "success",
                message: txToken.hash ?? "",
                messageEth: txEth ? txEth.hash : "",
            });
        } catch (error) {
            console.error(error);
            resolve({ status: "error", message: "Transaction failed. Check logs for details." });
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    startFaucetTask();
}

module.exports = async (toAddress, amountToken, amountEth, chain) => {
    console.log(
        `Received new request from ${toAddress} for ${amountToken} OVL and ${amountEth} ETH on chain ${chain}`
    );

    if (!PRIVATE_KEY || !INFURA_URL || !MOVE_URL || !BARTIO_URL || !FROM_ADDRESS) {
        return {
            status: "error",
            message: "Missing environment variables, please ask human to set them up.",
        };
    }

    // Determine the network settings based on the input chain
    let networkUrl;
    let contractAddress;
    let sendEth = false;

    switch (chain.toLowerCase()) {
        case "arb": // Arbitrum Sepolia
            networkUrl = INFURA_URL;
            contractAddress = CONTRACT_ADDRESSES.arb;
            sendEth = true;
            break;
        case "move": // Move chain
            networkUrl = MOVE_URL;
            contractAddress = CONTRACT_ADDRESSES.move;
            sendEth = true;
            break;
        case "bera": // Bera chain
            networkUrl = BARTIO_URL;
            contractAddress = CONTRACT_ADDRESSES.bera;
            sendEth = true;
            break;
        default:
            return { status: "error", message: "Unsupported chain specified." };
    }

    const provider = new ethers.JsonRpcProvider(networkUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const p = new Promise((resolve, reject) => {
        request_queue.push({
            toAddress,
            amountToken,
            amountEth,
            provider,
            wallet,
            chain,
            resolve,
            reject,
            contractAddress,
            sendEth,
        });
    });
    return await p;
};
