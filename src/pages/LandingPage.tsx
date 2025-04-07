import { ToolTile } from "@/components/landing-page/ToolTile";
import {
  CONVERTER_PATH,
  METADATA_REMOVER_PATH,
  BASE64_CONVERTER_PATH,
  BACKGROUND_REMOVER_PATH,
} from "@/constants/routes";

export default function LandingPage() {
  const tools = [
    {
      title: "Image Converter",
      features: [
        "Seamlessly convert between formats: PNG, JPEG, WEBP, AVIF, BMP, TIFF",
        "Compress and resize your images",
        "Batch process multiple files without any limits",
      ],
      linkTo: CONVERTER_PATH,
      linkText: "Try Converter",
    },
    {
      title: "Metadata Remover",
      features: [
        "Unveil image metadata including GPS, Camera, Date taken, ...",
        "Erase metadata instantly",
        "Check file location on Google Maps, if available",
      ],
      linkTo: METADATA_REMOVER_PATH,
      linkText: "Try Metadata Remover",
    },
    {
      title: "Base64 Converter",
      features: [
        "Convert images in different formats to base64 encoded strings",
        "Generate HTML img tags with base64 data",
        "Perfect for embedding small icons directly in your code",
      ],
      linkTo: BASE64_CONVERTER_PATH,
      linkText: "Try Base64 Converter",
    },
    {
      title: "Background Remover",
      features: [
        "Remove backgrounds from batch of images with one click",
        "All free with the best image quality",
        "Perfect for product photos, portraits, and more",
      ],
      linkTo: BACKGROUND_REMOVER_PATH,
      linkText: "Try Background Remover",
    },
  ];

  return (
    <div className="flex flex-col items-center py-12">
      <header className="mb-12 text-center">
        <h1 className="mb-16 font-extrabold">
          <div className="mb-4 text-3xl sm:text-4xl">Say Hello to</div>
          <div className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-5xl text-transparent sm:text-7xl">
            IMG TOOLS
          </div>
        </h1>
        <h2 className="mx-auto mb-8 text-lg sm:text-xl">
          <div>Transform your images effortlessly, all within your browser</div>
          <div>
            <strong>No uploads, no tracking</strong> - just pure, <strong>private</strong> image
            editing
          </div>
        </h2>
      </header>
      <div className="flex flex-wrap justify-center gap-10">
        {tools.map((tool, index) => (
          <ToolTile key={tool.title} index={index} {...tool} />
        ))}
      </div>
    </div>
  );
}
