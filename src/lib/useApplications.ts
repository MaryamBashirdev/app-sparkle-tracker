import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "./sheets";
import { supabase } from "./auth";

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Not authenticated");
      return fetchApplications(userId);
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
