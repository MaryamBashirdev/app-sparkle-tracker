import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "./sheets";
import { useAuth } from "./auth";

export function useApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("Not authenticated");
      return fetchApplications(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
