import { Link } from "react-router-dom";
import { HOME_PATH } from "@/constants/routes";
import { version } from "../../package.json";

export default function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 md:mb-0">
            <Link
              to={HOME_PATH}
              className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent"
            >
              IMG TOOLS
            </Link>
            <span className="text-muted-foreground ml-2 text-xs">Version: {version}</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} IMG TOOLS. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
