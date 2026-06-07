import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "./sheets";
import { useAuth } from "./auth";

export function useApplications() {
  const { user, ready } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.id ?? "anon"],
    queryFn: () => fetchApplications(user?.id),
    enabled: ready,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
