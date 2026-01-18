"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import Image from "next/image";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// AvatarImage with Next.js Image optimization
interface AvatarImageProps
  extends Omit<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>, "src"> {
  src?: string;
  priority?: boolean;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, priority = false, ...props }, ref) => {
  // 외부 URL이 아닌 경우 또는 src가 없는 경우 기본 Radix 이미지 사용
  const isExternalUrl = src?.startsWith("http");

  if (!src) {
    return null;
  }

  // Next.js Image 사용 (외부 URL인 경우)
  if (isExternalUrl) {
    return (
      <AvatarPrimitive.Image asChild ref={ref} {...props}>
        <Image
          src={src}
          alt=""
          fill
          sizes="40px"
          priority={priority}
          className={cn("aspect-square h-full w-full object-cover", className)}
        />
      </AvatarPrimitive.Image>
    );
  }

  // 내부 경로인 경우 기본 Radix 이미지 사용
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
