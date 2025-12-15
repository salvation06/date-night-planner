// date-memory-nft.ts - NFT minting for date memories
import { ApiPromise } from "@polkadot/api";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// TYPES
// =============================================================================

export interface ActivityReference {
  name: string;
  category: string;
  address?: string;
}

export interface RestaurantReference {
  name: string;
  cuisine: string;
  price: string;
  address?: string;
}

export interface DateMemoryData {
  headline: string;
  dateLabel: string;  // Date without time
  restaurant: RestaurantReference;
  activities: ActivityReference[];
  theme?: string;
  costEstimate?: string;
}

export interface MintedDateMemory {
  collectionId: number;
  itemId: number;
  metadataCid: string;
  owner: string;
  transactionHash: string;
  subscanUrl: string;
}

export interface CollectionInfo {
  collectionId: number;
  owner: string;
  transactionHash: string;
}

// Global flag to ensure web3Enable is only called once
let web3Enabled = false;

// Initialize Polkadot API
async function initPolkadot(): Promise<ApiPromise> {
  const { ApiPromise, WsProvider } = await import("@polkadot/api");
  const wsProvider = new WsProvider("wss://westend-asset-hub-rpc.polkadot.io");
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;
  return api;
}

// =============================================================================
// DATE MEMORY NFT CLASS
// =============================================================================

export class DateMemoryNFT {
  private api: ApiPromise | null = null;
  private account: InjectedAccountWithMeta | null = null;

  async initialize(): Promise<void> {
    console.log("🔗 Initializing Date Memory NFT Minter...");
    this.api = await initPolkadot();
    console.log("✅ API initialized");
  }

  async connectWallet(): Promise<InjectedAccountWithMeta> {
    console.log("🔐 Connecting wallet for NFT operations...");

    if (!web3Enabled) {
      const extensions = await web3Enable("Impress My Date");

      if (extensions.length === 0) {
        console.log("⏳ No extensions detected, retrying...");
        await new Promise((r) => setTimeout(r, 1000));
        const retryExtensions = await web3Enable("Impress My Date");

        if (retryExtensions.length === 0) {
          throw new Error(
            "No Polkadot wallet extension detected.\n\n" +
              "Please install Polkadot.js, SubWallet, or Talisman, then refresh.",
          );
        }
      }

      web3Enabled = true;
      console.log(`✅ Extensions enabled`);
    }

    const allAccounts = await web3Accounts();

    if (allAccounts.length === 0) {
      throw new Error(
        "No Polkadot accounts found.\n\n" +
          "Please:\n" +
          "1. Open your wallet extension\n" +
          "2. Create or import an account\n" +
          "3. Refresh this page and try again",
      );
    }

    this.account = allAccounts[0];
    console.log(`✅ Connected: ${this.account.meta.name || "Unnamed"}`);
    console.log(`   - Address: ${this.account.address}`);

    return this.account;
  }

  /**
   * Create NFT collection for date memories
   */
  async createCollection(collectionName: string, description: string): Promise<CollectionInfo> {
    if (!this.api) throw new Error("API not initialized");
    if (!this.account) throw new Error("Wallet not connected");

    console.log("\n════════════════════════════════════════════════════════");
    console.log("🎨 Creating Date Memory NFT Collection");
    console.log("════════════════════════════════════════════════════════");
    console.log("   - Name:", collectionName);
    console.log("   - Description:", description);

    const nextCollectionId = await this.api.query.nfts.nextCollectionId();
    const collectionId = Number(nextCollectionId.toString());
    console.log("   - Collection ID:", collectionId);

    const config = {
      settings: 0,
      maxSupply: null,
      mintSettings: {
        mintType: { Issuer: null },
        price: null,
        startBlock: null,
        endBlock: null,
        defaultItemSettings: 0,
      },
    };

    const tx = this.api.tx.nfts.create(this.account.address, config);

    const paymentInfo = await tx.paymentInfo(this.account.address);
    console.log("   - Estimated fee:", paymentInfo.partialFee.toHuman());

    const injector = await web3FromAddress(this.account.address);
    console.log("\n✍️  Signing transaction...");
    console.log("   🔔 CHECK YOUR WALLET");

    let txHashResult: string | null = null;

    const unsubscribe = await tx.signAndSend(
      this.account.address,
      { signer: injector.signer },
      ({ status, txHash, dispatchError }) => {
        if (!txHashResult) {
          txHashResult = txHash.toHex();
        }

        if (status.isInBlock) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
              console.error(`   ❌ ${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`);
            }
            return;
          }
          console.log("   ✅ Collection created in block:", status.asInBlock.toHex());
        }

        if (status.isFinalized) {
          console.log("   🎉 Finalized!");
          unsubscribe();
        }
      },
    );

    const txHash = txHashResult || "pending";

    console.log("\n✅✅✅ COLLECTION CREATED SUCCESSFULLY! ✅✅✅");
    console.log("   - Collection ID:", collectionId);
    console.log("   - TX Hash:", txHash);
    console.log("   - Owner:", this.account.address);
    console.log(`   - Subscan: https://assethub-westend.subscan.io/extrinsic/${txHash}`);

    // Set collection metadata
    console.log("\n📝 Setting collection metadata...");
    await this.waitForCollection(collectionId);
    
    const metadataString = JSON.stringify({
      name: collectionName,
      creator: this.account.address,
      created: new Date().toISOString(),
    });
    
    const metadataTx = this.api.tx.nfts.setCollectionMetadata(
      collectionId,
      metadataString
    );
    
    const metadataInjector = await web3FromAddress(this.account.address);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Metadata transaction timed out after 90 seconds"));
      }, 90000);

      metadataTx.signAndSend(
        this.account!.address,
        { 
          signer: metadataInjector.signer,
          tip: 1000000000000 // 1 WND tip for priority
        },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            clearTimeout(timeout);
            if (dispatchError) {
              console.error("   ❌ Error setting metadata");
              reject(new Error("Failed to set collection metadata"));
            } else {
              console.log("   ✅ Collection metadata set successfully");
              resolve();
            }
          }
        }
      ).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    console.log("════════════════════════════════════════════════════════\n");

    return {
      collectionId,
      owner: this.account.address,
      transactionHash: txHash,
    };
  }

  private async waitForCollection(collectionId: number, timeoutMs: number = 60000): Promise<void> {
    if (!this.api) throw new Error("API not initialized");

    console.log(`\n⏳ Waiting for collection ${collectionId} to be confirmed...`);
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const details = await this.api.query.nfts.collection(collectionId);

        if (details && details.toString() !== "") {
          console.log(`   ✅ Collection ${collectionId} confirmed on-chain!`);
          return;
        }

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ⏳ Waiting... (${elapsed}s)`);
        await new Promise((r) => setTimeout(r, 3000));
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    throw new Error(`Timeout: Collection ${collectionId} not confirmed after ${timeoutMs / 1000}s`);
  }

  /**
   * Mint date memory NFT
   */
  async mintDateMemory(collectionId: number, dateMemory: DateMemoryData): Promise<MintedDateMemory> {
    if (!this.api) throw new Error("API not initialized");
    if (!this.account) throw new Error("Wallet not connected");

    console.log("\n════════════════════════════════════════════════════════");
    console.log("💝 Minting Date Memory NFT");
    console.log("════════════════════════════════════════════════════════");
    console.log("   - Headline:", dateMemory.headline);
    console.log("   - Date:", dateMemory.dateLabel);
    console.log("   - Restaurant:", dateMemory.restaurant.name);
    console.log("   - Activities:", dateMemory.activities.length);

    // Wait for collection
    await this.waitForCollection(collectionId);

    // Get item ID
    const collectionDetails = await this.api.query.nfts.collection(collectionId);
    if (!collectionDetails || collectionDetails.toString() === "") {
      throw new Error(`Collection ${collectionId} does not exist`);
    }

    const details = collectionDetails as unknown as { items?: { toString(): string } };
    const itemId = Number(details.items?.toString() || "0");
    console.log("\n   - Next Item ID:", itemId);

    // Upload metadata to IPFS via Pinata
    console.log("\n📤 Uploading date memory metadata to IPFS...");
    const metadataCid = await this.uploadDateMemoryMetadata(dateMemory);
    console.log("   ✅ Metadata uploaded to IPFS");
    console.log("   - CID:", metadataCid);
    console.log("   - IPFS Gateway:", `https://gateway.pinata.cloud/ipfs/${metadataCid}`);

    // Mint NFT
    console.log("\n🎨 Minting NFT on-chain...");
    const mintTx = this.api.tx.nfts.mint(collectionId, itemId, this.account.address, null);

    const paymentInfo = await mintTx.paymentInfo(this.account.address);
    console.log("   - Estimated fee:", paymentInfo.partialFee.toHuman());

    const injector = await web3FromAddress(this.account.address);
    console.log("\n✍️  Signing mint transaction...");
    console.log("   🔔 CHECK YOUR WALLET");

    let mintTxHashResult: string | null = null;

    const mintUnsubscribe = await mintTx.signAndSend(
      this.account.address,
      { signer: injector.signer },
      ({ status, txHash, dispatchError }) => {
        if (!mintTxHashResult) {
          mintTxHashResult = txHash.toHex();
        }

        if (status.isInBlock) {
          if (dispatchError) {
            console.error("   ❌ Mint failed!");
            if (dispatchError.isModule) {
              const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
              console.error(`   ${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`);
            }
            return;
          }
          console.log("   ✅ NFT minted in block:", status.asInBlock.toHex());
        }

        if (status.isFinalized) {
          console.log("   🎉 Mint finalized!");
          mintUnsubscribe();
        }
      },
    );

    const mintTxHash = mintTxHashResult || "pending";
    const subscanUrl = `https://assethub-westend.subscan.io/account/${this.account.address}?tab=nft`;

    console.log("\n✅✅✅ DATE MEMORY NFT MINTED SUCCESSFULLY! ✅✅✅");
    console.log("   - Collection ID:", collectionId);
    console.log("   - Item ID:", itemId);
    console.log("   - Owner:", this.account.address);
    console.log("   - Mint TX Hash:", mintTxHash);
    console.log(`   - View on Subscan: ${subscanUrl}`);
    console.log("\n📦 Date Memory Metadata (stored on IPFS):");
    console.log("   - Metadata CID:", metadataCid);
    console.log("   - Headline:", dateMemory.headline);
    console.log("   - Date:", dateMemory.dateLabel);
    console.log("   - Restaurant:", dateMemory.restaurant.name);
    console.log(`   - View Metadata: https://gateway.pinata.cloud/ipfs/${metadataCid}`);
    console.log("════════════════════════════════════════════════════════\n");

    return {
      collectionId,
      itemId,
      metadataCid,
      owner: this.account.address,
      transactionHash: mintTxHash,
      subscanUrl,
    };
  }

  private async uploadDateMemoryMetadata(dateMemory: DateMemoryData): Promise<string> {
    const metadata = {
      name: dateMemory.headline,
      description: `A memorable date: ${dateMemory.headline} on ${dateMemory.dateLabel}`,
      external_url: "https://impressmydate.app",
      attributes: [
        { trait_type: "Date", value: dateMemory.dateLabel },
        { trait_type: "Restaurant", value: dateMemory.restaurant.name },
        { trait_type: "Cuisine", value: dateMemory.restaurant.cuisine },
        { trait_type: "Price Range", value: dateMemory.restaurant.price },
        { trait_type: "Activity Count", value: dateMemory.activities.length },
        { trait_type: "Cost Estimate", value: dateMemory.costEstimate || "N/A" },
        { trait_type: "Created", value: new Date().toISOString() },
      ],
      properties: {
        restaurant: {
          name: dateMemory.restaurant.name,
          cuisine: dateMemory.restaurant.cuisine,
          price: dateMemory.restaurant.price,
          address: dateMemory.restaurant.address,
        },
        activities: dateMemory.activities.map((activity) => ({
          name: activity.name,
          category: activity.category,
          address: activity.address,
        })),
      },
    };

    const { data, error } = await supabase.functions.invoke("pinata-upload", {
      body: {
        metadata,
        name: `date-memory-${dateMemory.dateLabel.replace(/\s+/g, "-").toLowerCase()}`,
      },
    });

    if (error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }

    if (!data?.cid) {
      throw new Error("IPFS upload failed: missing CID");
    }

    return data.cid as string;
  }

  async getCollectionInfo(collectionId: number): Promise<{
    exists: boolean;
    owner?: string;
    items?: number;
  }> {
    if (!this.api) throw new Error("API not initialized");

    const collectionDetails = await this.api.query.nfts.collection(collectionId);

    if (!collectionDetails || collectionDetails.toString() === "") {
      return { exists: false };
    }

    const details = collectionDetails as unknown as { owner?: { toString(): string }; items?: { toString(): string } };
    return {
      exists: true,
      owner: details.owner?.toString(),
      items: Number(details.items?.toString() || "0"),
    };
  }
}

export async function createUserDateMemoryCollection(username: string): Promise<CollectionInfo> {
  const minter = new DateMemoryNFT();
  await minter.initialize();
  await minter.connectWallet();

  return await minter.createCollection(
    `${username}'s Date Memories`,
    `A collection of memorable dates created by ${username} on Impress My Date`,
  );
}