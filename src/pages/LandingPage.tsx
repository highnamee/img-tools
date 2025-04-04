import { Link } from "react-router-dom";
import { CONVERTER_PATH, METADATA_REMOVER_PATH } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center py-12">
      <header className="mb-12 text-center">
        <h1 className="mb-16 font-extrabold">
          <div className="mb-4 text-4xl">Welcome to</div>
          <div className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-7xl text-transparent">
            IMG TOOLS
          </div>
        </h1>
        <h2 className="mx-auto mb-8 text-xl">
          <div>Experience seamless image processing directly in your browser.</div>
          <div>Your data remains private and secure.</div>
        </h2>
        <div className="flex justify-center space-x-4">
          <Button variant="default" size="lg" className="shadow-lg">
            <Link to={CONVERTER_PATH}>Converter</Link>
          </Button>
          <Button variant="outline" size="lg" className="shadow-lg">
            <Link to={METADATA_REMOVER_PATH}>Metadata Remover</Link>
          </Button>
        </div>
      </header>
    </div>
  );
}
