import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "./sheets";
import { useAuth } from "./auth";

export function useApplications() {
  const { user, ready } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("Not authenticated");
      return fetchApplications(user.id);
    },
    enabled: !!user?.id && ready
queryFn: () => {
  if (!user?.id) throw new Error("Not authenticated");
  return fetchApplications(user.id);
},
}
