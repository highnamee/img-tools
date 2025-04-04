import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {
  const location = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <NavigationMenu>
          <NavigationMenuList className="flex items-center gap-20">
            {/* Trigger for mobile view */}
            <NavigationMenuItem className="block md:hidden">
              <NavigationMenuTrigger className="flex items-center gap-2">
                <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                  FILE CONVERTER
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col">
                  <Link to="/file-converter">
                    <div
                      className={cn(
                        "hover:text-primary text-sm font-medium transition-colors",
                        location.pathname === "/file-converter"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      Image Converter
                    </div>
                  </Link>
                  <Link to="/file-converter/metadata">
                    <div
                      className={cn(
                        "hover:text-primary text-sm font-medium transition-colors",
                        location.pathname === "/file-converter/metadata"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      Image Metadata Remover
                    </div>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Visible in desktop view */}
            <NavigationMenuItem className="hidden md:flex">
              <Link to="/file-converter">
                <div className="flex items-center gap-2">
                  <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                    FILE CONVERTER
                  </span>
                </div>
              </Link>
            </NavigationMenuItem>

            <div className="hidden items-center gap-6 md:flex">
              <NavigationMenuItem>
                <Link to="/file-converter">
                  <div
                    className={cn(
                      "hover:text-primary text-sm font-medium transition-colors",
                      location.pathname === "/file-converter"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Image Converter
                  </div>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/file-converter/metadata">
                  <div
                    className={cn(
                      "hover:text-primary text-sm font-medium transition-colors",
                      location.pathname === "/file-converter/metadata"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Image Metadata Remover
                  </div>
                </Link>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
