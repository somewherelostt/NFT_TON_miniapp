"use client";
import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  TonConnectButton,
  TonConnectUIProvider,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { useTelegram } from "./telegram-provider";
// @ts-ignore
import TonWeb from "tonweb";

// Add contract address placeholder (replace with your deployed address)
const NFT_CONTRACT_ADDRESS = "<YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE>"; // TODO: Replace with your contract address

const steps = ["Generate", "Preview", "Export", "Deploy"];

// Helper: Acceptable image types
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/gif",
];

// Types
interface Layer {
  id: number;
  name: string;
}
interface Trait {
  name: string;
  url: string;
}
interface LayersPanelProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  selectedLayerId: number;
  setSelectedLayerId: React.Dispatch<React.SetStateAction<number>>;
  traits: Record<number, Trait[]>;
  setTraits: React.Dispatch<React.SetStateAction<Record<number, Trait[]>>>;
}

function LayersPanel({
  layers,
  setLayers,
  selectedLayerId,
  setSelectedLayerId,
  traits,
  setTraits,
}: LayersPanelProps) {
  const [nextId, setNextId] = useState(layers.length + 1);
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const addLayer = () => {
    const newLayer = { id: nextId, name: `Layer ${nextId}` };
    setLayers([...layers, newLayer]);
    setNextId(nextId + 1);
  };

  const removeLayer = (id: number) => {
    setLayers(layers.filter((l: Layer) => l.id !== id));
    setTraits((prev: Record<number, Trait[]>) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedLayerId === id && layers.length > 1) {
      setSelectedLayerId(layers[0].id);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Layers</h2>
      <ul className="space-y-2">
        {layers.map((layer: Layer) => (
          <li
            key={layer.id}
            className={`bg-gray-800 rounded px-3 py-2 flex items-center justify-between cursor-pointer transition border-2 ${
              selectedLayerId === layer.id
                ? "border-blue-500"
                : "border-transparent"
            }`}
            onClick={() => setSelectedLayerId(layer.id)}
          >
            {editingLayerId === layer.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLayers(
                    layers.map((l) =>
                      l.id === layer.id ? { ...l, name: editName || l.name } : l
                    )
                  );
                  setEditingLayerId(null);
                }}
                className="flex items-center gap-2 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  onBlur={() => setEditingLayerId(null)}
                />
                <button
                  type="submit"
                  className="text-blue-400 text-xs font-bold"
                >
                  Save
                </button>
              </form>
            ) : (
              <span className="flex-1 truncate" title={layer.name}>
                {layer.name}
              </span>
            )}
            <div className="flex items-center gap-1 ml-2">
              <button
                className="text-gray-400 hover:text-blue-400 text-xs font-bold"
                title="Rename layer"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingLayerId(layer.id);
                  setEditName(layer.name);
                }}
              >
                ✎
              </button>
              {layer.id > 1 && (
                <button
                  className="text-red-400 hover:text-red-600 text-xs font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  title="Remove layer"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition rounded py-2 font-semibold"
        onClick={addLayer}
      >
        + Add Layer
      </button>
    </div>
  );
}

interface TraitUploaderProps {
  layerId: number;
  traits: Record<number, Trait[]>;
  setTraits: React.Dispatch<React.SetStateAction<Record<number, Trait[]>>>;
}

function TraitUploader({ layerId, traits, setTraits }: TraitUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type) && f.size <= 2 * 1024 * 1024
    );
    if (!validFiles.length) return;
    const readers = validFiles.map((file) => {
      return new Promise<Trait>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({ name: file.name, url: e.target?.result as string });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((images) => {
      setTraits((prev) => ({
        ...prev,
        [layerId]: [...(prev[layerId] || []), ...images],
      }));
    });
  };

  return (
    <div
      className="w-full h-48 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <span className="text-4xl mb-2">⬆️</span>
      <span className="font-medium">Drag & drop images here</span>
      <span className="text-xs text-gray-400">
        or click to select files (PNG, JPG, GIF, SVG)
      </span>
      <span className="text-xs text-gray-500 mt-2">
        Max file size: 2MB per image
      </span>
    </div>
  );
}

interface TraitListProps {
  traits: Trait[] | undefined;
  selectedTraitIdx: number | undefined;
  setSelectedTraitIdx: (idx: number) => void;
}

function TraitList({
  traits,
  selectedTraitIdx,
  setSelectedTraitIdx,
}: TraitListProps) {
  if (!traits || !traits.length)
    return (
      <div className="text-gray-500 text-center">No traits uploaded yet.</div>
    );
  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      {traits.map((trait, idx) => (
        <div
          key={trait.url}
          className={`border-2 rounded p-1 cursor-pointer transition ${
            selectedTraitIdx === idx ? "border-blue-500" : "border-gray-700"
          }`}
          onClick={() => setSelectedTraitIdx(idx)}
        >
          <img
            src={trait.url}
            alt={trait.name}
            className="w-16 h-16 object-contain bg-gray-800 rounded"
          />
          <div className="text-xs text-center mt-1 truncate max-w-[64px]">
            {trait.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper: Generate all combinations of selected traits (one per layer)
function getAllCombinations(
  layers: Layer[],
  traits: Record<number, Trait[]>
): Trait[][] {
  if (!layers.length) return [];
  const traitArrays = layers.map((layer) => traits[layer.id] || []);
  if (traitArrays.some((arr) => arr.length === 0)) return [];
  // Cartesian product
  return traitArrays.reduce<Trait[][]>(
    (acc, curr) =>
      acc
        .map((a) => curr.map((b) => a.concat([b])))
        .reduce((a, b) => a.concat(b), []),
    [[]]
  );
}

// Helper: Composite images (stack base64 PNGs)
async function compositeImages(
  traits: Trait[],
  width = 512,
  height = 512
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve("");
    let loaded = 0;
    const images: HTMLImageElement[] = [];
    traits.forEach((trait, i) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loaded++;
        images[i] = img;
        if (loaded === traits.length) {
          images.forEach((img) => ctx.drawImage(img, 0, 0, width, height));
          resolve(canvas.toDataURL("image/png"));
        }
      };
      img.src = trait.url;
    });
  });
}

export default function Home() {
  // Layers and traits state
  const [layers, setLayers] = useState<Layer[]>([
    { id: 1, name: "Background" },
    { id: 2, name: "Layer 2" },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<number>(1);
  const [traits, setTraits] = useState<Record<number, Trait[]>>({}); // { [layerId]: [{name, url}] }
  // For each layer, track selected trait index
  const [selectedTraits, setSelectedTraits] = useState<Record<number, number>>(
    {}
  ); // { [layerId]: idx }
  const [currentStep, setCurrentStep] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nftImage, setNftImage] = useState<string>("");

  const { isTelegram, user } = useTelegram();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    // For each layer, if it has traits and no selected trait, select the first
    setSelectedTraits((prev) => {
      const updated = { ...prev };
      layers.forEach((layer) => {
        if (
          (traits[layer.id]?.length ?? 0) > 0 &&
          typeof prev[layer.id] !== "number"
        ) {
          updated[layer.id] = 0;
        }
      });
      return updated;
    });
  }, [traits, layers]);

  // Update selected trait for a layer
  const handleSelectTrait = (layerId: number, idx: number) => {
    setSelectedTraits((prev) => ({ ...prev, [layerId]: idx }));
  };

  // Compose preview: stack selected trait images in layer order
  const renderPreview = () => {
    // Only show if at least one trait is selected
    const images = layers
      .map((layer) => {
        const tArr = traits[layer.id] || [];
        const idx = selectedTraits[layer.id];
        return tArr[idx] ? tArr[idx].url : null;
      })
      .filter(Boolean);
    if (!images.length) {
      return (
        <div className="w-full h-48 bg-gray-800 rounded flex items-center justify-center text-gray-500">
          Click traits to preview
        </div>
      );
    }
    return (
      <div className="w-full h-48 bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
        {images.map((url, i) => (
          <img
            key={i}
            src={url as string}
            alt="preview"
            className="absolute left-0 top-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: i + 1 }}
          />
        ))}
      </div>
    );
  };

  // Export all combinations as ZIP
  const handleExport = async () => {
    const combinations = getAllCombinations(layers, traits);
    if (!combinations.length) return;
    const zip = new JSZip();
    const meta: any[] = [];
    for (let i = 0; i < combinations.length; ++i) {
      const combo = combinations[i];
      const imageData = await compositeImages(combo);
      const base64 = imageData.split(",")[1];
      zip.file(`images/nft_${i + 1}.png`, base64, { base64: true });
      // Simple metadata
      meta.push({
        name: `NFT #${i + 1}`,
        traits: combo.map((t, idx) => ({
          layer: layers[idx].name,
          trait: t.name,
        })),
        image: `images/nft_${i + 1}.png`,
      });
    }
    zip.file("metadata.json", JSON.stringify(meta, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "nft_collection.zip");
  };

  // TON Connect UI
  const manifestUrl =
    "https://raw.githubusercontent.com/ton-connect/demo-dapp-with-react/main/public/tonconnect-manifest.json"; // Use your own manifest for production

  // Simulate deploy to TON
  const handleDeploy = async () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeploySuccess(true);
    }, 2000);
  };

  // Add a new function for minting NFT (placeholder for now)
  const handleMintNFT = async (
    name: string,
    description: string,
    image: string
  ) => {
    if (!tonConnectUI.account) {
      alert("Please connect your Tonkeeper wallet first.");
      return;
    }
    if (NFT_CONTRACT_ADDRESS.startsWith("<")) {
      alert("Please set your deployed NFT contract address in the code.");
      return;
    }
    try {
      // Prepare TonWeb
      const tonweb = new TonWeb(
        new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC")
      );
      const userAddress = tonConnectUI.account.address;
      const contractAddress = NFT_CONTRACT_ADDRESS;
      // Prepare payload for mint (this is a placeholder, adjust for your contract)
      // You may need to encode the function call properly for your NFT contract
      // For now, just send a simple payload (replace with real encoding for your contract)
      const payload = new TextEncoder().encode(
        JSON.stringify({ name, description, image })
      );
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contractAddress,
            amount: TonWeb.utils.toNano("0.05").toString(),
            payload: TonWeb.utils.bytesToBase64(payload),
          },
        ],
      });
      alert("Mint transaction sent! Check your Tonkeeper wallet.");
    } catch (e) {
      alert("Mint failed: " + (e instanceof Error ? e.message : e));
    }
  };

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {/* Add animated gradient background to the main container */}
      <div className="min-h-screen w-full flex flex-col font-sans relative overflow-x-hidden">
        {/* Animated Gradient Background */}
        <div
          className="fixed inset-0 -z-10 animate-gradient bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 opacity-90"
          style={{
            background:
              "linear-gradient(270deg, #0f2027, #2c5364, #24243e, #6a11cb, #2575fc)",
            backgroundSize: "400% 400%",
            animation: "gradientBG 15s ease infinite",
          }}
        />
        {/* Custom Header */}
        <header className="w-full py-6 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 shadow-lg flex flex-col items-center mb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            TON NFT MiniApp Creator
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Create, preview, and mint NFTs on TON. Now with Telegram Mini App
            support!
          </p>
          {isTelegram && user && (
            <div className="mt-2 text-sm text-blue-200">
              Welcome, {user.first_name}
              {user.last_name ? ` ${user.last_name}` : ""} (Telegram)
            </div>
          )}
        </header>
        {/* Stepper */}
        <div className="flex items-center justify-center gap-8 py-6 border-b border-gray-800 relative">
          {steps.map((step, idx) => (
            <button
              key={step}
              className="flex items-center gap-2 focus:outline-none group bg-transparent"
              onClick={() => setCurrentStep(idx)}
              type="button"
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg border-2 transition-all group-hover:border-blue-400 group-hover:text-blue-400 ${
                  idx === currentStep
                    ? "bg-blue-600 border-blue-400 text-white"
                    : idx < currentStep
                    ? "bg-green-600 border-green-400 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-400"
                }`}
              >
                {idx < currentStep ? (
                  <span className="text-xl">✓</span>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`font-semibold text-base group-hover:text-blue-400 transition-colors ${
                  idx === currentStep
                    ? "text-blue-400"
                    : idx < currentStep
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                {step}
              </span>
              {idx < steps.length - 1 && (
                <span className="w-8 h-1 bg-gray-700 rounded-full mx-2" />
              )}
            </button>
          ))}
          <div className="ml-auto mr-8 absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <TonConnectButton />
            {/* Show wallet address if connected */}
            {tonConnectUI.account ? (
              <span className="text-xs bg-gray-800 px-2 py-1 rounded text-green-400 border border-green-700 ml-2">
                Connected: {tonConnectUI.account.address.slice(0, 6)}...
                {tonConnectUI.account.address.slice(-4)}
              </span>
            ) : (
              <span className="text-xs bg-gray-800 px-2 py-1 rounded text-red-400 border border-red-700 ml-2">
                Not connected
              </span>
            )}
          </div>
        </div>

        {/* NFT Minting Form */}
        <section className="flex flex-col items-center justify-center py-10 px-2 w-full">
          <div className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-blue-700 p-10 flex flex-col items-center backdrop-blur-md bg-opacity-80 transition-all duration-500 hover:scale-[1.02] hover:shadow-blue-500/30">
            <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-center tracking-tight drop-shadow-lg animate-pulse">
              Mint a New NFT
            </h2>
            <p className="text-gray-300 mb-6 text-center text-base">
              Fill in the details below to mint your unique NFT on TON testnet.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleMintNFT(nftName, nftDescription, nftImage);
              }}
              className="flex flex-col gap-6 w-full"
            >
              <input
                type="text"
                placeholder="NFT Name"
                className="rounded-xl px-5 py-3 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-inner hover:shadow-blue-500/10"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                required
              />
              <textarea
                placeholder="NFT Description"
                className="rounded-xl px-5 py-3 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 min-h-[80px] resize-none shadow-inner hover:shadow-purple-500/10"
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                required
              />
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-700 rounded-xl py-8 cursor-pointer bg-gray-900 hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-blue-500/20">
                <span className="text-blue-400 font-semibold mb-2">
                  Upload NFT Image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setNftImage(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  required
                />
                {nftImage ? (
                  <img
                    src={nftImage}
                    alt="NFT Preview"
                    className="w-full h-44 object-contain rounded-xl border border-blue-700 mt-4 shadow-lg animate-fadeIn"
                  />
                ) : (
                  <span className="text-xs text-gray-400 mt-2">
                    PNG, JPG, GIF, SVG. Max 2MB.
                  </span>
                )}
              </label>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-pink-500 transition-all duration-300 rounded-xl py-3 font-bold text-lg shadow-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-white tracking-wide focus:ring-4 focus:ring-blue-400/50 focus:ring-offset-2 animate-fadeIn"
                disabled={
                  !tonConnectUI.account ||
                  !nftName ||
                  !nftDescription ||
                  !nftImage
                }
              >
                🚀 Mint NFT
              </button>
              {!tonConnectUI.account && (
                <div className="text-xs text-red-400 mt-1 text-center animate-fadeIn">
                  Connect your wallet to mint.
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar: Layers */}
          <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 min-h-full">
            <LayersPanel
              layers={layers}
              setLayers={setLayers}
              selectedLayerId={selectedLayerId}
              setSelectedLayerId={setSelectedLayerId}
              traits={traits}
              setTraits={setTraits}
            />
            <div>
              <h3 className="text-md font-semibold mb-2">Stats</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>
                  Total traits:{" "}
                  {Object.values(traits).reduce((a, arr) => a + arr.length, 0)}
                </li>
                <li>
                  Max NFTs:{" "}
                  {Object.values(traits).reduce(
                    (a, arr) => a * (arr.length || 1),
                    1
                  )}
                </li>
                <li>Collection size: 100</li>
              </ul>
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-10 gap-8">
            <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-center text-lg font-semibold mb-4">
                Upload traits for:{" "}
                <span className="text-blue-400">
                  {layers.find((l) => l.id === selectedLayerId)?.name}
                </span>
              </div>
              <TraitUploader
                layerId={selectedLayerId}
                traits={traits}
                setTraits={setTraits}
              />
              <TraitList
                traits={traits[selectedLayerId]}
                selectedTraitIdx={selectedTraits[selectedLayerId]}
                setSelectedTraitIdx={(idx) =>
                  handleSelectTrait(selectedLayerId, idx)
                }
              />
            </div>
            {/* Export step summary and buttons */}
            {currentStep === 2 && (
              <div className="w-full max-w-2xl flex flex-col gap-8">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="text-lg font-bold mb-1">
                      Collection Summary
                    </div>
                    <div className="flex gap-8 text-center">
                      <div>
                        <div className="text-2xl text-blue-400 font-bold">
                          {getAllCombinations(layers, traits).length}
                        </div>
                        <div className="text-gray-400 text-sm">
                          NFTs Generated
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl text-purple-400 font-bold">
                          {layers.length}
                        </div>
                        <div className="text-gray-400 text-sm">Layers</div>
                      </div>
                      <div>
                        <div className="text-2xl text-green-400 font-bold">
                          {Object.values(traits).reduce(
                            (a, arr) => a + arr.length,
                            0
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Total Traits
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl text-orange-400 font-bold">
                          600x600
                        </div>
                        <div className="text-gray-400 text-sm">Resolution</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center">
                    <div className="font-semibold mb-2">Export Locally</div>
                    <div className="text-gray-400 text-sm mb-4 text-center">
                      Download your NFT collection as a ZIP file containing
                      images and metadata.
                    </div>
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 transition rounded px-8 py-3 font-bold text-lg disabled:opacity-50"
                      onClick={handleExport}
                      disabled={getAllCombinations(layers, traits).length === 0}
                    >
                      <span className="mr-2">⬇️</span> Download ZIP
                    </button>
                  </div>
                  <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center">
                    <div className="font-semibold mb-2">
                      Deploy to TON Testnet
                    </div>
                    <div className="text-gray-400 text-sm mb-4 text-center">
                      Upload and deploy your collection to the TON blockchain
                      testnet.
                    </div>
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 transition rounded px-8 py-3 font-bold text-lg disabled:opacity-50"
                      onClick={() => setCurrentStep(3)}
                      disabled={getAllCombinations(layers, traits).length === 0}
                    >
                      <span className="mr-2">🚀</span> Start Deploy Process
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Deploy step */}
            {currentStep === 3 && (
              <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-center text-lg font-semibold mb-4">
                  Deploy to TON Testnet
                </div>
                <div className="mb-6 text-gray-400 text-center">
                  This will simulate deploying your NFT collection to the TON
                  testnet. (Real minting can be added in v2!)
                </div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 transition rounded px-8 py-3 font-bold text-lg disabled:opacity-50 mb-4"
                  onClick={handleDeploy}
                  disabled={deploying}
                >
                  {deploying ? "Deploying..." : "Deploy to TON Testnet"}
                </button>
                {/* MVP Feature: Mint NFT Button */}
                <button
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 transition rounded px-8 py-3 font-bold text-lg mt-2"
                  onClick={handleMintNFT}
                >
                  Mint NFT to My TON Wallet
                </button>
                {deploySuccess && (
                  <div className="mt-6 text-green-400 font-bold text-center">
                    ✅ Successfully deployed to TON testnet! (Simulated)
                  </div>
                )}
              </div>
            )}
          </main>
          {/* Preview */}
          <aside className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col gap-6 min-h-full">
            <div>
              <h2 className="text-lg font-bold mb-4">Preview</h2>
              {renderPreview()}
              <ul className="mt-4 text-sm text-gray-400">
                {layers.map((layer) => (
                  <li key={layer.id}>
                    {layer.name}:{" "}
                    <span className="text-white">
                      {traits[layer.id]?.[selectedTraits[layer.id]]?.name ||
                        "None"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      {/* Add fadeIn animation keyframes */}
      <style>{`
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1) both; }
`}</style>
    </TonConnectUIProvider>
  );
}
