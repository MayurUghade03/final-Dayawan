import { Moon, Paintbrush, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeSwitcher() {
  const {
    mode,
    setMode,
    selectedThemeId,
    setSelectedThemeId,
    availableThemes,
    globalDefaultThemeId,
    activeTheme,
  } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border"
          aria-label="Theme settings"
          title="Theme settings"
        >
          <Paintbrush className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel>Theme mode</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setMode("light")}
          aria-checked={mode === "light"}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light {mode === "light" ? "✓" : ""}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setMode("dark")}
          aria-checked={mode === "dark"}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark {mode === "dark" ? "✓" : ""}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setMode("system")}
          aria-checked={mode === "system"}
        >
          <SunMoon className="mr-2 h-4 w-4" />
          System {mode === "system" ? "✓" : ""}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme palette</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setSelectedThemeId(null)}
          aria-checked={!selectedThemeId}
        >
          Follow global default ({globalDefaultThemeId === activeTheme.id ? activeTheme.name : "Default"}){" "}
          {!selectedThemeId ? "✓" : ""}
        </DropdownMenuItem>
        {availableThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            className="cursor-pointer"
            onClick={() => setSelectedThemeId(theme.id)}
            aria-checked={selectedThemeId === theme.id}
          >
            {theme.name} {selectedThemeId === theme.id ? "✓" : ""}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
