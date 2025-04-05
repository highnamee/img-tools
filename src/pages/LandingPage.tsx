import { Link } from "react-router-dom";
import { CONVERTER_PATH, METADATA_REMOVER_PATH } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
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
          <div>Transform your images effortlessly, all within your browser.</div>
          <div>No uploads, no tracking—just pure, private image editing.</div>
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-2xl font-bold">Image Converter</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Seamlessly convert between formats: PNG, JPEG, WEBP, AVIF, BMP, TIFF</li>
            <li>Compress and resize your images with ease</li>
            <li>Batch process multiple files without any limits</li>
          </ul>
          <Button variant="default" size="lg" className="mt-6 shadow-lg">
            <Link to={CONVERTER_PATH}>Give the Converter a Try</Link>
          </Button>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-2xl font-bold">Metadata Remover</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Unveil image metadata including GPS, Camera, Date taken, ...</li>
            <li>Erase metadata instantly</li>
            <li>Check file location on Google Maps, if available</li>
          </ul>
          <Button variant="outline" size="lg" className="mt-6 shadow-lg">
            <Link to={METADATA_REMOVER_PATH}>Try Metadata Remover Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
