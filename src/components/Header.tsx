// Update Header.tsx to add the background remover navigation
import { NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  HOME_PATH,
  CONVERTER_PATH,
  METADATA_REMOVER_PATH,
  BASE64_CONVERTER_PATH,
  BACKGROUND_REMOVER_PATH,
} from "@/constants/routes";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <NavigationMenu className="min-w-full">
          <NavigationMenuList className="flex items-center gap-20">
            {/* Trigger for mobile view */}
            <NavigationMenuItem className="block lg:hidden">
              <NavigationMenuTrigger className="flex items-center gap-2">
                <Link
                  to={HOME_PATH}
                  className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent"
                  viewTransition
                >
                  IMG TOOLS
                </Link>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex w-52 flex-col">
                  <NavLink
                    to={CONVERTER_PATH}
                    className={({ isActive }) =>
                      cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )
                    }
                    viewTransition
                  >
                    Converter
                  </NavLink>
                  <NavLink
                    to={METADATA_REMOVER_PATH}
                    className={({ isActive }) =>
                      cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )
                    }
                    viewTransition
                  >
                    Metadata Remover
                  </NavLink>
                  <NavLink
                    to={BASE64_CONVERTER_PATH}
                    className={({ isActive }) =>
                      cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )
                    }
                    viewTransition
                  >
                    Base64 Converter
                  </NavLink>
                  <NavLink
                    to={BACKGROUND_REMOVER_PATH}
                    className={({ isActive }) =>
                      cn(
                        "hover:text-primary text-md p-2 font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )
                    }
                    viewTransition
                  >
                    Background Remover
                  </NavLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Visible in desktop view */}
            <NavigationMenuItem className="hidden lg:flex">
              <Link to={HOME_PATH} className="flex items-center gap-2">
                <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                  IMG TOOLS
                </span>
              </Link>
            </NavigationMenuItem>

            <div className="hidden items-center gap-6 lg:flex">
              <NavigationMenuItem>
                <NavLink
                  to={CONVERTER_PATH}
                  className={({ isActive }) =>
                    cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                  viewTransition
                >
                  Converter
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink
                  to={METADATA_REMOVER_PATH}
                  className={({ isActive }) =>
                    cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                  viewTransition
                >
                  Metadata Remover
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink
                  to={BASE64_CONVERTER_PATH}
                  className={({ isActive }) =>
                    cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                  viewTransition
                >
                  Base64 Converter
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink
                  to={BACKGROUND_REMOVER_PATH}
                  className={({ isActive }) =>
                    cn(
                      "hover:text-primary text-md font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                  viewTransition
                >
                  Background Remover
                </NavLink>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>

          <a
            href="https://github.com/highnamee/img-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary text-md text-muted-foreground ml-auto flex items-center font-medium transition-colors"
          >
            <img src="/github.svg" alt="GitHub" className="w-8" />
          </a>
        </NavigationMenu>
      </div>
    </header>
  );
}
