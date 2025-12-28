"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Member } from "@/types/database";

export function useCurrentMember() {
  const { user, member, setUser, setMember, setIsLoading, isLoading } =
    useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchMember = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setMember(null);
          return;
        }

        setUser(authUser);

        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (memberError) {
          setError(memberError.message);
          return;
        }

        setMember(memberData as Member);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();

    // Auth state 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setMember(null);
      } else if (session?.user) {
        setUser(session.user);
        // 멤버 정보 다시 가져오기
        const { data: memberData } = await supabase
          .from("members")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (memberData) {
          setMember(memberData as Member);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setMember, setIsLoading]);

  return {
    user,
    member,
    isLoading,
    error,
    isAdmin: member?.position === "professor",
  };
}
