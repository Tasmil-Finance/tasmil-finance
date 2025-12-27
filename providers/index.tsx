"use client";

import { RainbowKitProvider, type Theme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { WagmiProvider } from "wagmi";
import { defaultNetwork, wagmiConfig } from "@/config/connectors/wagmi";
import { NavProvider } from "@/context/nav-context";
import { WalletProvider } from "@/context/wallet-context";
import "@rainbow-me/rainbowkit/styles.css";

// Custom DeFi light theme matching globals.css light mode colors
// biome-ignore lint: Light theme available for future dynamic switching
const defiLightTheme: Theme = {
  blurs: {
    modalOverlay: "blur(8px)",
  },
  colors: {
    // Primary accent color - using --primary from globals.css
    accentColor: "hsl(195 100% 50%)", // --primary light mode
    accentColorForeground: "hsl(210 40% 98%)", // --primary-foreground light mode

    // Action buttons - using border colors from globals.css
    actionButtonBorder: "hsl(214.3 31.8% 91.4%)", // --border light mode
    actionButtonBorderMobile: "hsl(214.3 31.8% 91.4%)", // --border light mode
    actionButtonSecondaryBackground: "hsl(210 40% 96.1%)", // --muted light mode

    // Close button - using muted colors from globals.css
    closeButton: "hsl(215.4 16.3% 46.9%)", // --muted-foreground light mode
    closeButtonBackground: "hsl(210 40% 96.1%)", // --muted light mode

    // Connect button - using card colors from globals.css
    connectButtonBackground: "hsl(0 0% 100%)", // --card light mode
    connectButtonBackgroundError: "hsl(0 84.2% 60.2%)", // --destructive light mode
    connectButtonInnerBackground: "hsl(240 4.8% 95.9%)", // --sidebar-accent light mode
    connectButtonText: "hsl(240 5.3% 26.1%)", // --sidebar-foreground light mode
    connectButtonTextError: "hsl(210 40% 98%)", // --destructive-foreground

    // Connection indicator - using primary from globals.css
    connectionIndicator: "hsl(195 100% 50%)", // --primary light mode

    // Download cards - using card colors from globals.css
    downloadBottomCardBackground: "hsl(0 0% 100%)", // --card light mode
    downloadTopCardBackground: "hsl(0 0% 100%)", // --background light mode

    // Error states - using destructive colors from globals.css
    error: "hsl(0 84.2% 60.2%)", // --destructive light mode

    // General borders - using border colors from globals.css
    generalBorder: "hsl(214.3 31.8% 91.4%)", // --border light mode
    generalBorderDim: "hsl(220 13% 91%)", // --sidebar-border light mode

    // Menu items - using sidebar-accent from globals.css
    menuItemBackground: "hsl(240 4.8% 95.9%)", // --sidebar-accent light mode

    // Modal - using background and border colors from globals.css
    modalBackdrop: "rgba(0, 0, 0, 0.5)",
    modalBackground: "hsl(0 0% 100%)", // --background light mode
    modalBorder: "hsl(220 13% 91%)", // --sidebar-border light mode
    modalText: "hsl(240 5.3% 26.1%)", // --sidebar-foreground light mode
    modalTextDim: "hsl(215.4 16.3% 46.9%)", // --muted-foreground light mode
    modalTextSecondary: "hsl(240 5.3% 26.1%)", // --sidebar-foreground light mode

    // Profile actions - using sidebar colors from globals.css
    profileAction: "hsl(240 4.8% 95.9%)", // --sidebar-accent light mode
    profileActionHover: "hsl(0 0% 100%)", // --card light mode
    profileForeground: "hsl(240 5.3% 26.1%)", // --sidebar-foreground light mode

    // Selected options - using primary from globals.css
    selectedOptionBorder: "hsl(195 100% 50%)", // --primary light mode

    // Standby state - using muted-foreground from globals.css
    standby: "hsl(215.4 16.3% 46.9%)", // --muted-foreground light mode
  },
  fonts: {
    body: "var(--font-inter)", // Using custom font from globals.css
  },
  radii: {
    actionButton: "0.5rem", // --radius from globals.css
    connectButton: "0.5rem", // --radius from globals.css
    menuButton: "0.5rem", // --radius from globals.css
    modal: "0.5rem", // --radius from globals.css
    modalMobile: "0.5rem", // --radius from globals.css
  },
  shadows: {
    connectButton: "0 4px 12px rgba(0, 0, 0, 0.1)",
    dialog: "0 8px 32px rgba(0, 0, 0, 0.15)",
    profileDetailsAction: "0 2px 4px rgba(0, 0, 0, 0.05)",
    selectedOption: "0 2px 4px rgba(0, 0, 0, 0.05)",
    selectedWallet: "0 2px 4px rgba(0, 0, 0, 0.05)",
    walletLogo: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
};

// Custom DeFi dark theme matching globals.css dark mode colors
const defiDarkTheme: Theme = {
  blurs: {
    modalOverlay: "blur(8px)",
  },
  colors: {
    // Primary accent color - using gradient colors from button-v2.tsx
    accentColor: "hsl(200 100% 85%)", // #B5EAFF - gradient start color
    accentColorForeground: "hsl(0 0% 0%)", // black text for contrast

    // Action buttons - using secondary colors from globals.css dark mode
    actionButtonBorder: "oklch(0.269 0 0)", // --secondary dark mode
    actionButtonBorderMobile: "oklch(0.269 0 0)", // --secondary dark mode
    actionButtonSecondaryBackground: "oklch(0.269 0 0)", // --secondary dark mode

    // Close button - using muted colors from globals.css dark mode
    closeButton: "oklch(0.708 0 0)", // --muted-foreground dark mode
    closeButtonBackground: "oklch(0.269 0 0)", // --secondary dark mode

    // Connect button - using background and secondary from globals.css dark mode
    connectButtonBackground: "oklch(0.145 0 0)", // --background dark mode (black)
    connectButtonBackgroundError: "oklch(0.704 0.191 22.216)", // --destructive dark mode
    connectButtonInnerBackground: "oklch(0.269 0 0)", // --secondary dark mode
    connectButtonText: "oklch(0.985 0 0)", // --foreground dark mode
    connectButtonTextError: "oklch(0.985 0 0)", // --foreground dark mode

    // Connection indicator - using accent color
    connectionIndicator: "hsl(200 100% 85%)", // #B5EAFF

    // Download cards - using background and secondary from globals.css dark mode
    downloadBottomCardBackground: "oklch(0.269 0 0)", // --secondary dark mode
    downloadTopCardBackground: "oklch(0.145 0 0)", // --background dark mode (black)

    // Error states - using destructive colors from globals.css dark mode
    error: "oklch(0.704 0.191 22.216)", // --destructive dark mode

    // General borders - using border colors from globals.css dark mode
    generalBorder: "oklch(0 0 0)", // --border dark mode
    generalBorderDim: "oklch(0 0 0)", // --sidebar-border dark mode

    // Menu items - using secondary from globals.css dark mode
    menuItemBackground: "oklch(0.269 0 0)", // --secondary dark mode

    // Modal - using background and secondary from globals.css dark mode
    modalBackdrop: "rgba(0, 0, 0, 0.8)",
    modalBackground: "oklch(0.145 0 0)", // --background dark mode (black)
    modalBorder: "oklch(0.3 0 0)", // --border dark mode
    modalText: "oklch(0.985 0 0)", // --foreground dark mode
    modalTextDim: "oklch(0.708 0 0)", // --muted-foreground dark mode
    modalTextSecondary: "oklch(0.985 0 0)", // --foreground dark mode

    // Profile actions - using secondary from globals.css dark mode
    profileAction: "oklch(0.269 0 0)", // --secondary dark mode
    profileActionHover: "oklch(0.3 0 0)", // slightly lighter for hover
    profileForeground: "oklch(0.1 0 0)", // --foreground dark mode

    // Selected options - using accent color
    selectedOptionBorder: "hsl(200 100% 10%)", // #B5EAFF

    // Standby state - using muted-foreground from globals.css dark mode
    standby: "oklch(0.708 0 0)", // --muted-foreground dark mode
  },
  fonts: {
    body: "var(--font-inter)", // Using custom font from globals.css
  },
  radii: {
    actionButton: "0.5rem", // --radius from globals.css
    connectButton: "0.5rem", // --radius from globals.css
    menuButton: "0.5rem", // --radius from globals.css
    modal: "0.5rem", // --radius from globals.css
    modalMobile: "0.5rem", // --radius from globals.css
  },
  shadows: {
    connectButton: "0 4px 12px rgba(0, 0, 0, 0.15)",
    dialog: "0 8px 32px rgba(0, 0, 0, 0.3)",
    profileDetailsAction: "0 2px 4px rgba(0, 0, 0, 0.1)",
    selectedOption: "0 2px 4px rgba(0, 0, 0, 0.1)",
    selectedWallet: "0 2px 4px rgba(0, 0, 0, 0.1)",
    walletLogo: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
};

export function AppProvider({ children }: PropsWithChildren) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          appInfo={{
            appName: "Tasmil Finance",
            learnMoreUrl: process.env.NEXT_PUBLIC_URL || "",
          }}
          initialChain={defaultNetwork}
          modalSize="wide"
          theme={defiDarkTheme}
        >
          <WalletProvider>
            <NavProvider>{children}</NavProvider>
          </WalletProvider>
          <Toaster position="top-right" richColors />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
