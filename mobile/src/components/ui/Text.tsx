import { memo } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

const WEIGHTS = {
  regular: "font-sans",
  medium: "font-sans-medium",
  semibold: "font-sans-semibold",
  bold: "font-sans-bold",
  extrabold: "font-sans-extrabold",
} as const;

// Colour lives in `tone` so it never fights a text-* class in className
const TONES = {
  ink: "text-ink",
  soft: "text-ink-soft",
  muted: "text-muted",
  faint: "text-faint",
  white: "text-white",
  lime: "text-lime",
  limeInk: "text-lime-ink",
  danger: "text-danger",
  blue: "text-[#1F4A73]",
} as const;

export type TextProps = RNTextProps & {
  weight?: keyof typeof WEIGHTS;
  tone?: keyof typeof TONES;
  className?: string;
};

export const Text = memo(function Text({
  weight = "regular",
  tone = "ink",
  className = "",
  ...props
}: TextProps) {
  return <RNText {...props} className={`${WEIGHTS[weight]} ${TONES[tone]} ${className}`} />;
});
