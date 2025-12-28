"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toggleLike } from "@/lib/actions/mentoring";

interface LikeButtonProps {
  postId: string;
  likesCount: number;
  userLiked: boolean;
}

export function LikeButton({ postId, likesCount, userLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(userLiked);
  const [count, setCount] = useState(likesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    const result = await toggleLike(postId);

    if (result.error) {
      // Revert on error
      setLiked(liked);
      setCount(count);
      alert(result.error);
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? "fill-red-500 text-red-500" : ""
        }`}
      />
      <span>{count}</span>
    </Button>
  );
}
