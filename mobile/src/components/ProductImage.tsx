import { Image, type ImageProps } from "expo-image";
import { cssInterop } from "nativewind";
import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Shimmer } from "./Skeleton";

cssInterop(Image, { className: "style" });

// expo-image with disk caching and a soft cross-fade, used for every product photo.
// className sizes and rounds the frame; the light sweeps across it until the photo arrives.
export const ProductImage = memo(function ProductImage({
  className = "",
  ...props
}: ImageProps & { className?: string }) {
  const { source } = props;
  const key = typeof source === "object" && source && "uri" in source ? source.uri : source;
  // Which photo has finished, so a recycled row starts shimmering again for its new photo
  const [settled, setSettled] = useState<unknown>(null);

  return (
    <View className={`overflow-hidden bg-soft ${className}`}>
      <Image
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={250}
        recyclingKey={typeof key === "string" ? key : undefined}
        style={StyleSheet.absoluteFill}
        {...props}
        onLoad={(e) => {
          setSettled(key);
          props.onLoad?.(e);
        }}
        onError={(e) => {
          setSettled(key);
          props.onError?.(e);
        }}
      />
      {key != null && settled !== key && <Shimmer />}
    </View>
  );
});
