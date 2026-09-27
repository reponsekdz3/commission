import React from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { colors, ThemeColors } from "../theme";

type Mode = "light" | "dark" | "system";
type State = {
  mode: Mode;
  palette: ThemeColors;
  setMode: (mode: Mode) => void;
  hydrate: () => Promise<void>;
};

const paletteFor = (mode: Mode): ThemeColors => {
  if (mode === "dark") return colors.dark;
  if (mode === "light") return colors.light;
  return Appearance.getColorScheme() === "dark" ? colors.dark : colors.light;
};

export const useTheme = create<State>((set) => ({
  mode: "system",
  palette: paletteFor("system"),
  setMode: (mode) => {
    set({ mode, palette: paletteFor(mode) });
    void AsyncStorage.setItem("imizi.theme", mode);
  },
  hydrate: async () => {
    const saved = await AsyncStorage.getItem("imizi.theme");
    const mode: Mode =
      saved === "dark" || saved === "light" || saved === "system" ? saved : "system";
    set({ mode, palette: paletteFor(mode) });
  },
}));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useTheme((s) => s.hydrate);
  const mode = useTheme((s) => s.mode);

  React.useEffect(() => {
    void hydrate();
    const sub = Appearance.addChangeListener(() => {
      if (useTheme.getState().mode === "system") {
        useTheme.setState({ palette: paletteFor("system") });
      }
    });
    return () => sub.remove();
  }, [hydrate]);

  React.useEffect(() => {
    if (mode === "system") {
      useTheme.setState({ palette: paletteFor("system") });
    }
  }, [mode]);

  return React.createElement(React.Fragment, null, children);
}
