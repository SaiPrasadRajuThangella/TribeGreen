import { Image, type ImageProps } from "expo-image";
import { cssInterop } from "nativewind";
import { memo } from "react";

cssInterop(Image, { className: "style" });

// expo-image with disk caching and a soft cross-fade, used for every product photo
export const ProductImage = memo(function ProductImage({
  className = "",
  ...props
}: ImageProps & { className?: string }) {
  return (
    <Image
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={250}
      recyclingKey={typeof props.source === "string" ? props.source : undefined}
      className={`bg-soft ${className}`}
      {...props}
    />
  );
});
