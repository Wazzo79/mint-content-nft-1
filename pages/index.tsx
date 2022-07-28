import * as ipfsClient from "ipfs-http-client";

import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Container,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  Spacer,
  Spinner,
  Stack,
  Textarea,
  Toast,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import MintModal from "../components/mintmodal";
import type { NextPage } from "next";
import Web3 from "web3";

const abi = require("../abi.json");
declare let window: any;

const ipfs = ipfsClient.create({ host: "ipfs.infura.io", port: 5001, protocol: "https" });

interface IAttribute {
  trait_type: string;
  value: string;
}

interface IArtistSplit {
  address: string;
  share: number | undefined;
}

let web3: Web3;

const Home: NextPage = () => {
  const [artist, setArtist] = useState("");
  let attributes: IAttribute[] = [];
  const [artistSplits, setArtistSplits] = useState<IArtistSplit[]>([]);
  const [artistAddress, setArtistAddress] = useState("");
  const [artistShare, setArtistShare] = useState<number>();
  const [audio, setAudio] = useState<File>();
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const [loading, setLoading] = useState<boolean>();
  const [name, setName] = useState("");
  const [videoSource, setVideoSource] = useState("");
  const [uploadFile, setUploadFile] = useState<File>();
  const [ipfsFileUrl, setIpfsFileUrl] = useState("");
  const [account, setAccount] = useState("");
  const [nftContract, setNftContract] = useState<any>();
  const [maxCopies, setMaxCopies] = useState<number>(50);
  const [mintCost, setMintCost] = useState<number>(0.1);
  const [royalty, setRoyalty] = useState<number>(10);
  const [deployedNFTContract, setDeployedNftContractContract] = useState("");
  const [deployedSplitterContract, setDeployedSplitterContract] = useState("");
  const [platformAddress, setPlatformAddress] = useState("");

  const fileArtworkRef = useRef(null);
  const fileAudioRef = useRef(null);
  const toast = useToast();

  const contractAddress = "0x8d1487d8DA75D2064271B0fA4FDe49F18303C1Eb";

  const create = async () => {
    if (artistSplits.length === 0) {
      toast({
        title: "Error",
        description: "You need to define creator split in order to be paid ongoing royalties.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    if (artistSplits.map((m) => m.address).some((s) => s == platformAddress)) {
      toast({
        title: "Error",
        description: "Artist address cannot be the same as platform address",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    setLoading(true);
    const contentUrl = await uploadContentFileToIPFS();
    const metadataUrl = await createNFTJson(contentUrl);
    await deploy(metadataUrl);
    setLoading(false);
  };

  useEffect(() => {
    onConnect();
  }, []);

  useEffect(() => {}, [ipfsFileUrl]);

  useEffect(() => {}, [attributes]);

  const clearAll = () => {
    attributes = [];
    setArtistSplits([]);
    if (fileAudioRef.current) (fileAudioRef.current as any).value = null;
    setArtist("");
    setMaxCopies(50);
    setMintCost(0.1);
    setDescription("");
    setPlatformAddress("");
    setRoyalty(10);
    if (fileArtworkRef.current) (fileArtworkRef.current as any).value = null;
    setLoading(false);
    setName("");
    setVideoSource("");
    setUploadFile(undefined);
    setIpfsFileUrl("");
  };

  const deploy = async (metadataUrl: string | undefined) => {
    let royaltyMod = royalty * 100;
    let artistAddresses = artistSplits.map((m) => m.address);
    artistAddresses.push(platformAddress);
    let artistShares = artistSplits.map((m) => m.share! * 100);
    let totalShare: any = artistShares.reduce((a: any, b: any) => a + b);
    let index = 500 / royaltyMod;
    let platformShare = totalShare * index;
    artistShares.push(platformShare);
    royaltyMod += 500;

    let contractUri = await nftContract.methods
      .deploy(royaltyMod.toString(), artistAddresses, artistShares, metadataUrl, maxCopies, web3.utils.toWei(mintCost.toString()))
      .send({ from: account });

    if (contractUri !== undefined) {
      setDeployedNftContractContract(contractUri.events[0].address);
      setDeployedSplitterContract(contractUri.events[1].address);
    }
  };

  const detectCurrentProvider = () => {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
    return provider;
  };

  const onConnect = async () => {
    try {
      const currentProvider = detectCurrentProvider();
      if (currentProvider) {
        if (currentProvider !== window.ethereum) {
          console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
        await currentProvider.request({ method: "eth_requestAccounts" });
        web3 = new Web3(currentProvider);

        const userAccount = await web3.eth.getAccounts();
        setAccount(userAccount[0]);

        var contract = new web3.eth.Contract(abi, contractAddress);
        setNftContract(contract);

        window.ethereum.on("accountsChanged", function (accounts: any) {
          accounts[0] === undefined ? setAccount("") : setAccount(accounts[0]);
        });
      }
    } catch (err) {
      console.log("There was an error fetching your accounts. Make sure your Ethereum client is configured correctly.");
    }
  };

  const createVideo = async () => {
    setLoading(true);
    const formData = new FormData();

    formData.append("audio", (fileAudioRef.current as any).files[0]);
    formData.append("image", (fileArtworkRef.current as any).files[0]);
    formData.append("fileName", name);

    const res = await fetch("/api/createvideo", {
      method: "POST",
      body: formData,
    });

    const fileBlob = await res.blob();

    var video = document.getElementsByTagName("video")[0];
    let objectURL = URL.createObjectURL(fileBlob);
    video.src = objectURL;

    let file = new File([fileBlob], `${name}.mp4`);

    setUploadFile(file);
    setVideoSource(URL.createObjectURL(fileBlob));

    setLoading(false);
  };

  console.log(videoSource);

  const handleArtistSplitChange = () => {
    let tempArtistSplit: IArtistSplit = { address: artistAddress, share: artistShare };
    setArtistSplits([...artistSplits, tempArtistSplit]);

    setArtistAddress("");
    setArtistShare(0);
  };

  const addAttribute = (name: string, value: string) => {
    let tempAttribute: IAttribute = { trait_type: name, value: value };
    attributes = [...attributes, tempAttribute];
  };

  const removeArtistSplit = (index: number) => {
    let tempArr = [...artistSplits];
    tempArr.splice(index, 1);

    setArtistSplits(tempArr);
    setArtistAddress("");
    setArtistShare(1);
  };

  const handleImageChange = async (e: any) => {
    let file = e.target.files[0];
    setImage(file);
  };

  const handleAudioChange = (e: any) => {
    let file = e.target.files[0];
    setAudio(file);
  };

  const uploadContentFileToIPFS = async () => {
    if (uploadFile !== undefined) {
      setLoading(true);
      let filePath = (await ipfs.add(uploadFile)).path;
      setLoading(false);
      return filePath;
    }
  };

  const createNFTJson = async (contentUrl: string | undefined) => {
    setLoading(true);

    addAttribute("Artist(s)", artist);

    const jsn = JSON.stringify({
      description: description,
      image: `https://ipfs.infura.io/ipfs/${contentUrl}`,
      name: name,
      attributes: attributes,
    });

    const blob = new Blob([jsn], { type: "application/json" });
    const file = new File([blob], "file.json");

    const fileAdded = await ipfs.add(file);
    setLoading(false);
    return `https://ipfs.infura.io/ipfs/${fileAdded.path}`;
  };

  return (
    <>
      <Container mt="20" mb="20" maxW={["100%", "70%"]}>
        <HStack mb="5" spacing={10}>
          <Heading>Create Music NFT</Heading>
          <Button onClick={() => onConnect()}>
            {account !== "" ? `${account.substring(0, 5)}...${account.substring(account.length - 4, account.length)}` : "Connect Wallet"}
          </Button>
        </HStack>

        <Stack direction={["column", "row"]}>
          <VStack>
            <FormControl isRequired>
              <FormLabel>Track Title</FormLabel>
              <Input type="text" onChange={(e: any) => setName(e.target.value)} value={name} placeholder="Title" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Track Description</FormLabel>
              <Textarea onChange={(e: any) => setDescription(e.target.value)} value={description} placeholder="Description" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Artist(s)</FormLabel>
              <Input type="text" onChange={(e: any) => setArtist(e.target.value)} value={artist} placeholder="Artist(s)" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>DV Platform Royalty Address</FormLabel>
              <Input type="text" onChange={(e: any) => setPlatformAddress(e.target.value)} value={platformAddress} placeholder="Platform Address" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Maximum copies to release</FormLabel>
              <Input type="number" onChange={(e: any) => setMaxCopies(e.target.value)} value={maxCopies} placeholder="e.g. 50" />
            </FormControl>
            <HStack width="100%">
              <FormControl isRequired>
                <FormLabel>Mint Cost (ETH)</FormLabel>
                <Input type="number" onChange={(e: any) => setMintCost(e.target.value)} value={mintCost} placeholder="e.g. 0.1" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Royalty (%)</FormLabel>
                <Input type="number" min="5" max="30" onChange={(e: any) => setRoyalty(e.target.value)} value={royalty} placeholder="e.g. 10" />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Upload Artwork</FormLabel>
              <Input pl="1" pt="1" ref={fileArtworkRef} type="file" accept="image/*" onChange={handleImageChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Upload Audio</FormLabel>
              <Input pl="1" pt="1" type="file" ref={fileAudioRef} onChange={handleAudioChange} />
            </FormControl>
            <Divider></Divider>
            <HStack>
              <FormControl>
                <FormLabel>Creator Address</FormLabel>
                <Input type="text" placeholder="Address" onChange={(e) => setArtistAddress(e.target.value)} value={artistAddress} />
              </FormControl>
              <FormControl>
                <FormLabel>Creator Share</FormLabel>
                <Input type="number" placeholder="Value" onChange={(e) => setArtistShare(parseInt(e.target.value))} value={artistShare} />
              </FormControl>
              <IconButton
                disabled={artistAddress === "" || artistShare === 0 || videoSource !== ""}
                aria-label=""
                icon={<AddIcon />}
                alignSelf="flex-end"
                onClick={() => handleArtistSplitChange()}
              />
            </HStack>
            {artistSplits.map((artistSplit: IArtistSplit, index) => (
              <HStack key={index}>
                <FormControl>
                  <Input disabled type="text" placeholder="Address" value={artistSplit.address} />
                </FormControl>
                <FormControl>
                  <Input disabled type="number" placeholder="Share" value={artistSplit.share} />
                </FormControl>
                <IconButton aria-label="" icon={<DeleteIcon />} alignSelf="flex-end" onClick={() => removeArtistSplit(index)} disabled={videoSource !== ""} />
              </HStack>
            ))}
            <Divider></Divider>
            <Box>
              <Center>
                <video controls autoPlay preload="auto" width="300px" height="300px" hidden={videoSource == ""}></video>
              </Center>
            </Box>
            <FormControl hidden={deployedNFTContract === ""}>
              <FormLabel>NFT Contract Address</FormLabel>
              <Input disabled type="text" placeholder="NFT Contract Address" value={deployedNFTContract} />
            </FormControl>
            <FormControl hidden={deployedSplitterContract === ""}>
              <FormLabel>Payment Contract Address</FormLabel>
              <Input disabled type="text" placeholder="Payment Contrct Address" value={deployedSplitterContract} />
            </FormControl>
            <Divider></Divider>
            <Stack direction={["column", "row"]}>
              <Button onClick={() => clearAll()} colorScheme="red">
                Reset
              </Button>
              <Button
                onClick={createVideo}
                hidden={uploadFile !== undefined}
                disabled={name === "" || description === "" || artist === "" || platformAddress === "" || artistSplits.length === 0}
              >
                {loading ? <Spinner /> : "Create Video"}
              </Button>
              <Button onClick={() => create()} hidden={videoSource === "" || deployedNFTContract !== ""}>
                {loading ? <Spinner /> : "Create Contract"}
              </Button>
              <Button as="a" href={`https://rinkeby.etherscan.io/address/${deployedNFTContract}`} target="_blank" hidden={deployedNFTContract === ""}>
                View NFT Contract
              </Button>
              <Button as="a" href={`https://rinkeby.etherscan.io/address/${deployedSplitterContract}`} target="_blank" hidden={deployedSplitterContract === ""}>
                View Royalty Contract
              </Button>

              <MintModal account={account} nftContract={deployedNFTContract} web3={web3} mintCost={mintCost} videoSource={videoSource} />
            </Stack>
          </VStack>
          <Spacer />
        </Stack>
      </Container>
    </>
  );
};

export default Home;
