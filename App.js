import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { ethers } from "ethers";
import { Navbar } from "./Navbar";
import flashloan from "./flashloan.json"


const App =() => {

    
    const contractAddress = '0xF29f8Ab4b30BA050137A231d9E51D1FCFD889d51'; 

    let [blockchainProvider, setBlockchainProvider] = useState(undefined);
    let [metamask, setMetamask] = useState(undefined);
    let [metamaskNetwork, setMetamaskNetwork] = useState(undefined);
    let [metamaskSigner, setMetamaskSigner] = useState(undefined);
    const [networkId, setNetworkId] = useState(undefined);
    const [loggedInAccount, setAccounts] = useState(undefined);
    const [etherBalance, setEtherBalance] = useState(undefined);
    const [isError, setError] = useState(false);

    const[contract, setReadContract] = useState(null);
    const[writeContract, setWriteContract] = useState(null);
    const[execute, getExecute] = useState(null);

    const[thisContractAddress, receiveContractAddress] = useState(null);
    const[info, setInfo] =useState(null);



    let alertMessage ;

    const connect = async () => {
        try {
            let provider, network, metamaskProvider, signer, accounts;

            if (typeof window.ethereum !== 'undefined') {
                // Connect to RPC  
                console.log('loadNetwork')
                try {

                    //console.log("acc", acc); 
                    //window.ethereum.enable();
                    //await handleAccountsChanged();
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await handleAccountsChanged(accounts);
                } catch (err) {
                    if (err.code === 4001) {
                        // EIP-1193 userRejectedRequest error
                        // If this happens, the user rejected the connection request.
                        console.log('Please connect to MetaMask.');
                    } else {
                        console.error(err);
                    }
                }
                provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/c811f30d8ce746e5a9f6eb173940e98a`)
                // const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545")
                setBlockchainProvider(provider);
                network = await provider.getNetwork()
                console.log(network.chainId);
                setNetworkId(network.chainId);

                // Connect to Metamask  
                metamaskProvider = new ethers.providers.Web3Provider(window.ethereum)
                setMetamask(metamaskProvider)

                signer = await metamaskProvider.getSigner(accounts[0])
                setMetamaskSigner(signer)

                metamaskNetwork = await metamaskProvider.getNetwork();
                setMetamaskNetwork(metamaskNetwork.chainId);

                console.log(network);

                if (network.chainId !== metamaskNetwork.chainId) {
                    alert("Your Metamask wallet is not connected to " + network.name);

                    setError("Metamask not connected to RPC network");
                }
                let  tempContract = new ethers.Contract(contractAddress,flashloan,provider);
                setReadContract(tempContract);
                let tempContract2 = new ethers.Contract(contractAddress,flashloan,signer);
                setWriteContract(tempContract2);

            } else setError("Could not connect to any blockchain!!");

            return {
                provider, metamaskProvider, signer,
                network: network.chainId
            }

        } catch (e) {
            console.error(e);
            setError(e);
        }

    }


    const handleAccountsChanged = async (accounts) => {
        if (typeof accounts !== "string" || accounts.length < 1) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        console.log("t1", accounts);
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            alert('Please connect to MetaMask.');
        } else if (accounts[0] !== loggedInAccount) {
            setAccounts(accounts[0]);
        }
    }

    useEffect(() => {
        const init = async () => {

            const { provider, metamaskProvider, signer, network } = await connect();

            const accounts = await metamaskProvider.listAccounts();
            console.log(accounts[0]);
            setAccounts(accounts[0]);

            if (typeof accounts[0] == "string") {
                setEtherBalance(ethers.utils.formatEther(
                    Number(await metamaskProvider.getBalance(accounts[0])).toString()
                ));
            }
        }

        init();

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        window.ethereum.on('chainChanged', function (networkId) {
            // Time to reload your interface with the new networkId
            //window.location.reload();
            unsetStates();
        })

    }, []);

    useEffect(() => {
        (async () => {
            if (typeof metamask == 'object' && typeof metamask.getBalance == 'function'
                && typeof loggedInAccount == "string") {
                setEtherBalance(ethers.utils.formatEther(
                    Number(await metamask.getBalance(loggedInAccount)).toString()
                ));
                
            }
        })()
    }, [loggedInAccount]);

    const unsetStates = useCallback(() => {
        setBlockchainProvider(undefined);
        setMetamask(undefined);
        setMetamaskNetwork(undefined);
        setMetamaskSigner(undefined);
        setNetworkId(undefined);
        setAccounts(undefined);
        setEtherBalance(undefined);
        setReadContract(undefined);
        setWriteContract(undefined);


    }, []);

    const isReady = useCallback(() => {

        return (
            typeof blockchainProvider !== 'undefined'
            && typeof metamask !== 'undefined'
            && typeof metamaskNetwork !== 'undefined'
            && typeof metamaskSigner !== 'undefined'
            && typeof networkId !== 'undefined'
            && typeof loggedInAccount !== 'undefined'
            && typeof contract !== 'undefined'
            && typeof writeContract !== 'undefined'
        );
    }, [
        blockchainProvider,
        metamask,
        metamaskNetwork,
        metamaskSigner,
        networkId,
        loggedInAccount,
        contract,
        writeContract
    ]);    

    const getContractAdd = async() =>{
        try {
            //debugger;
           let val = await contract.getContractAddress();
           receiveContractAddress(val);
           setInfo("NOTE: Send some DAI from Metamask to this contrat address and then tap Flashloan button to execute.")
        } catch (error) {
            console.log(error);
        }
   
       }

    const flashloanFunction =async () =>{
        try {
            await writeContract.flashloan();
            getExecute('Flashoan executed successfully. Check on Etherscan');
        } catch (error) {
            console.log(error);
        }
    }   

    return(
        <div className="container">
        <h4> Flashloan Project </h4>

        <button  type="button" className="btn btn-primary" onClick = {connect}> Click </button>
        
        {loggedInAccount}
        <br/><br/>
        <button type="button" className="btn btn-primary" onClick ={() => getContractAdd()}> Contract Address</button>
            <br/><br />
            <h6>Address: {thisContractAddress}</h6>
            <h6>{info} </h6>

        <button type="button" className="btn btn-primary" onClick ={() => flashloanFunction()}> Flashloan </button>
            <h6>{execute}</h6>    
        </div>

    )
}
export default App;