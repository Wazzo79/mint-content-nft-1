import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import Web3 from "web3";

const abi = require("../mintABI.json");

export default function MintModal(props: any) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [agentAddress, setAgentAddress] = useState("");
  const [loading, setLoading] = useState<boolean>();
  const [nftContractAddress, setNFTContractAddress] = useState(props.nftContract);
  const [nftContract, setNFTContract] = useState<any>();
  const [tokenId, setTokenId] = useState("");

  const open = () => {
    setAgentAddress("");
    onOpen();
  };

  const contractChange = (event: any) => {
    setNFTContractAddress(event.target.value);
  };

  useEffect(() => {
    if (props.nftContract !== "") {
      setNFTContractAddress(props.nftContract);
    }
    if (nftContractAddress !== "" && props.web3 !== undefined) {
      var contract = new props.web3.eth.Contract(abi, nftContractAddress);
      setNFTContract(contract);
    }
  }, [props.nftContract, nftContractAddress, props.web3]);

  const mint = async () => {
    setLoading(true);
    console.log(agentAddress);

    var newTokenId = await nftContract.methods.totalSupply().call();

    await nftContract.methods.safeMint(agentAddress).send({ from: props.account, value: props.web3.utils.toWei(props.mintCost.toString()) });
    setTokenId(newTokenId);
    debugger;
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => open()} hidden={props.deployedNFTContract === ""}>Mint</Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mint NFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              <FormControl>
                <FormLabel>NFT Contract</FormLabel>
                <Input placeholder="NFT Contract Address" onChange={contractChange} value={nftContractAddress} />
              </FormControl>
              <FormControl>
                <FormLabel>Agent Wallet Address</FormLabel>
                <Input placeholder="Agent Wallet Address" value={agentAddress} onChange={(e) => setAgentAddress(e.target.value)} />
              </FormControl>
              <Button as="a" hidden={tokenId === ""} href={`https://testnet.rarible.com/token/${nftContractAddress}:${tokenId}`} target="_blank">
                View token on Rarible
              </Button>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="blue" mr={3} onClick={() => mint()}>
              {loading ? <Spinner /> : "Mint NFT"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
