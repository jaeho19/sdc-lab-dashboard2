"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteMentoringPost } from "@/lib/actions/mentoring";

interface DeletePostButtonProps {
  postId: string;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    const result = await deleteMentoringPost(postId);

    if (result.error) {
      alert(result.error);
      setIsLoading(false);
    }
    // redirect happens in the action
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      삭제
    </Button>
  );
}
