import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Itinerary } from "@/types";

interface MintedNFTResult {
  ipfsCid: string;
  ipfsUrl: string;
}

interface MintNFTButtonProps {
  itinerary: Itinerary;
  existingNft?: {
    ipfs_cid: string;
    subscan_url?: string;
    status: string;
  } | null;
  onMinted?: (nft: MintedNFTResult) => void;
}

type MintStep = "idle" | "uploading" | "saving" | "success" | "error";

export function MintNFTButton({ itinerary, existingNft, onMinted }: MintNFTButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mintedNft, setMintedNft] = useState<MintedNFTResult | null>(null);

  const handleMint = async () => {
    setStep("uploading");
    setError(null);

    try {
      console.log("🚀 Starting NFT mint for itinerary:", itinerary.id);

      // Prepare metadata for IPFS
      const metadata = {
        name: itinerary.headline,
        description: `A memorable date: ${itinerary.headline} on ${itinerary.date}`,
        external_url: "https://impressmydate.app",
        attributes: [
          { trait_type: "Date", value: itinerary.date },
          { trait_type: "Restaurant", value: itinerary.restaurant.name },
          { trait_type: "Cuisine", value: itinerary.restaurant.cuisine },
          { trait_type: "Price Range", value: itinerary.restaurant.price },
          { trait_type: "Activity Count", value: itinerary.activities.length },
          { trait_type: "Cost Estimate", value: itinerary.costEstimate || "N/A" },
          { trait_type: "Created", value: new Date().toISOString() },
        ],
        properties: {
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
        },
      };

      console.log("📤 Uploading metadata to IPFS via pinata-upload...");
      
      // Upload to IPFS via edge function
      const { data: ipfsData, error: ipfsError } = await supabase.functions.invoke("pinata-upload", {
        body: {
          metadata,
          name: `date-memory-${itinerary.date.replace(/\s+/g, "-").toLowerCase()}`,
        },
      });

      if (ipfsError) {
        console.error("IPFS upload error:", ipfsError);
        throw new Error(`IPFS upload failed: ${ipfsError.message}`);
      }

      if (!ipfsData?.cid) {
        console.error("IPFS response missing CID:", ipfsData);
        throw new Error("IPFS upload failed: missing CID in response");
      }

      console.log("✅ Metadata uploaded to IPFS, CID:", ipfsData.cid);

      setStep("saving");

      // Save NFT record to database
      console.log("💾 Saving NFT record via save-nft...");
      const { data: saveData, error: saveError } = await supabase.functions.invoke("save-nft", {
        body: {
          itinerary_id: itinerary.id,
          ipfs_cid: ipfsData.cid,
          status: "minted",
        },
      });

      if (saveError) {
        console.error("Save NFT error:", saveError);
        throw new Error(`Failed to save NFT record: ${saveError.message}`);
      }

      console.log("✅ NFT record saved:", saveData);

      const result: MintedNFTResult = {
        ipfsCid: ipfsData.cid,
        ipfsUrl: ipfsData.url || `https://gateway.pinata.cloud/ipfs/${ipfsData.cid}`,
      };

      setMintedNft(result);
      setStep("success");
      toast.success("Date Memory NFT created successfully!");
      onMinted?.(result);
    } catch (err) {
      console.error("Mint error:", err);
      setError(err instanceof Error ? err.message : "Failed to create NFT");
      setStep("error");
      toast.error("Failed to create NFT");
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
                    This will create a permanent record of your date memory stored on IPFS.
                  </p>
                  <Button onClick={handleMint} className="w-full gap-2" variant="romantic">
                    <Sparkles className="w-4 h-4" />
                    Create Date Memory NFT
                  </Button>
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
                    <p className="text-sm font-semibold">Date Memory Created!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your memory is now stored permanently on IPFS
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(mintedNft.ipfsUrl, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on IPFS
                  </Button>
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
                    <p className="text-sm font-semibold text-red-600">Creation Failed</p>
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