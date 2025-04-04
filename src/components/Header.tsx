import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/file-converter" className="flex items-center gap-2">
            <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
              File Converter
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/file-converter"
              className={cn(
                "hover:text-primary text-sm font-medium transition-colors",
                location.pathname === "/file-converter" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Image Converter
            </Link>
            <Link
              to="/file-converter/metadata"
              className={cn(
                "hover:text-primary text-sm font-medium transition-colors",
                location.pathname === "/file-converter/metadata"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              Image Metadata Remover
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
