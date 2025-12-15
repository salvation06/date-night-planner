import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ExternalLink, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateMemoryNFT, type DateMemoryData, type MintedDateMemory } from "@/lib/date-memory-nft";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Itinerary } from "@/types";

interface MintNFTButtonProps {
  itinerary: Itinerary;
  existingNft?: {
    ipfs_cid: string;
    subscan_url?: string;
    status: string;
  } | null;
  onMinted?: (nft: MintedDateMemory) => void;
}

type MintStep = "idle" | "connecting" | "uploading" | "minting" | "saving" | "success" | "error";

const DEFAULT_COLLECTION_ID = 1; // Use a shared collection or create per-user

export function MintNFTButton({ itinerary, existingNft, onMinted }: MintNFTButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mintedNft, setMintedNft] = useState<MintedDateMemory | null>(null);

  const handleMint = async () => {
    setStep("connecting");
    setError(null);

    try {
      const minter = new DateMemoryNFT();
      await minter.initialize();
      
      // Connect wallet
      const account = await minter.connectWallet();
      console.log("Connected wallet:", account.address);

      setStep("uploading");

      // Prepare date memory data (without times)
      const dateMemory: DateMemoryData = {
        headline: itinerary.headline,
        dateLabel: itinerary.date,
        restaurant: {
          name: itinerary.restaurant.name,
          cuisine: itinerary.restaurant.cuisine,
          price: itinerary.restaurant.price,
          address: itinerary.restaurant.address,
        },
        activities: itinerary.activities.map((a) => ({
          name: a.name,
          category: a.category,
          address: a.address,
        })),
        costEstimate: itinerary.costEstimate,
      };

      setStep("minting");

      // Mint the NFT
      const result = await minter.mintDateMemory(DEFAULT_COLLECTION_ID, dateMemory);
      setMintedNft(result);

      setStep("saving");

      // Save to database
      const { error: saveError } = await supabase.functions.invoke("save-nft", {
        body: {
          itinerary_id: itinerary.id,
          ipfs_cid: result.metadataCid,
          collection_id: result.collectionId,
          item_id: result.itemId,
          transaction_hash: result.transactionHash,
          subscan_url: result.subscanUrl,
          wallet_address: result.owner,
          status: "minted",
        },
      });

      if (saveError) {
        console.error("Failed to save NFT record:", saveError);
        // Don't fail - the NFT was still minted
      }

      setStep("success");
      toast.success("Date Memory NFT minted successfully!");
      onMinted?.(result);
    } catch (err) {
      console.error("Mint error:", err);
      setError(err instanceof Error ? err.message : "Failed to mint NFT");
      setStep("error");
      toast.error("Failed to mint NFT");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("idle");
      setError(null);
      setMintedNft(null);
    }, 200);
  };

  // If already minted, show view button
  if (existingNft && existingNft.status === "minted") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] text-gold hover:text-gold-dark gap-1"
        onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${existingNft.ipfs_cid}`, "_blank")}
      >
        <Check className="w-3 h-3" />
        View NFT
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] text-gold hover:text-gold-dark gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="w-3 h-3" />
        Mint NFT
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Create Date Memory NFT
            </DialogTitle>
            <DialogDescription>
              Mint this memorable date as an NFT on the Polkadot blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Memory Preview */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-sm">{itinerary.headline}</h4>
              <p className="text-xs text-muted-foreground">{itinerary.date}</p>
              <div className="text-xs space-y-1">
                <p>🍽️ {itinerary.restaurant.name}</p>
                {itinerary.activities.length > 0 && (
                  <p>✨ {itinerary.activities.length} activities</p>
                )}
              </div>
            </div>

            {/* Steps Progress */}
            <AnimatePresence mode="wait">
              {step === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    This will create a permanent on-chain record of your date memory.
                  </p>
                  <Button onClick={handleMint} className="w-full gap-2" variant="romantic">
                    <Wallet className="w-4 h-4" />
                    Connect Wallet & Mint
                  </Button>
                </motion.div>
              )}

              {step === "connecting" && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                  <p className="text-sm">Connecting to wallet...</p>
                  <p className="text-xs text-muted-foreground">
                    Please approve the connection in your wallet extension
                  </p>
                </motion.div>
              )}

              {step === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                  <p className="text-sm">Uploading to IPFS...</p>
                  <p className="text-xs text-muted-foreground">
                    Storing your date memory metadata on decentralized storage
                  </p>
                </motion.div>
              )}

              {step === "minting" && (
                <motion.div
                  key="minting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                  <p className="text-sm">Minting NFT on blockchain...</p>
                  <p className="text-xs text-muted-foreground">
                    Please approve the transaction in your wallet
                  </p>
                </motion.div>
              )}

              {step === "saving" && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                  <p className="text-sm">Saving NFT record...</p>
                </motion.div>
              )}

              {step === "success" && mintedNft && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">NFT Minted Successfully!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Collection #{mintedNft.collectionId}, Item #{mintedNft.itemId}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${mintedNft.metadataCid}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Metadata
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(mintedNft.subscanUrl, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Subscan
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    Close
                  </Button>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                    <span className="text-xl">❌</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-600">Minting Failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setStep("idle")}>
                      Try Again
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}