import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { HOME_PATH, CONVERTER_PATH, METADATA_REMOVER_PATH } from "@/constants/routes";

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
                <Link
                  to={HOME_PATH}
                  className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent"
                >
                  IMG TOOLS
                </Link>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col">
                  <Link to={CONVERTER_PATH}>
                    <div
                      className={cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        location.pathname === CONVERTER_PATH
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      Converter
                    </div>
                  </Link>
                  <Link to={METADATA_REMOVER_PATH}>
                    <div
                      className={cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        location.pathname === METADATA_REMOVER_PATH
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      Metadata Remover
                    </div>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Visible in desktop view */}
            <NavigationMenuItem className="hidden md:flex">
              <Link to={CONVERTER_PATH}>
                <div className="flex items-center gap-2">
                  <Link
                    to={HOME_PATH}
                    className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent"
                  >
                    IMG TOOLS
                  </Link>
                </div>
              </Link>
            </NavigationMenuItem>

            <div className="hidden items-center gap-6 md:flex">
              <NavigationMenuItem>
                <Link to={CONVERTER_PATH}>
                  <div
                    className={cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      location.pathname === CONVERTER_PATH
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Converter
                  </div>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to={METADATA_REMOVER_PATH}>
                  <div
                    className={cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      location.pathname === METADATA_REMOVER_PATH
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Metadata Remover
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
