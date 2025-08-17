import { useQuery } from "@tanstack/react-query";
import type { SystemLog } from "@/types";

export function useTerminal() {
  const { data: logs = [], isLoading } = useQuery<SystemLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 1000, // Refetch every second for real-time updates
  });

  return { logs, isLoading };
}
