/** @type {import('tailwindcss').Config} */
module.exports = {
  // relative: resolve globs from this file, not from wherever the CLI runs
  content: { relative: true, files: ["./src/**/*.{js,jsx,ts,tsx}"] },
  presets: [require("nativewind/preset")],
  // The app is light-only; "class" stops the system theme from flipping styles
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#F1F2EE",
        card: "#FFFFFF",
        soft: "#E8EAE4",
        line: "#E1E3DC",
        ink: { DEFAULT: "#121212", soft: "#2B2B2B" },
        muted: "#73776E",
        faint: "#A3A69D",
        lime: { DEFAULT: "#C8E98A", soft: "#E8F5D0", deep: "#9CC556", ink: "#3A5512" },
        danger: { DEFAULT: "#E5484D", soft: "#FDE8E8" },
        whatsapp: "#25D366",
      },
      fontFamily: {
        // One family per weight: Android cannot synthesise weights for custom fonts
        sans: ["PlusJakartaSans_400Regular"],
        "sans-medium": ["PlusJakartaSans_500Medium"],
        "sans-semibold": ["PlusJakartaSans_600SemiBold"],
        "sans-bold": ["PlusJakartaSans_700Bold"],
        "sans-extrabold": ["PlusJakartaSans_800ExtraBold"],
      },
      borderRadius: {
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};
