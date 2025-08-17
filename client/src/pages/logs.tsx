import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Terminal from "@/components/terminal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemLog } from "@/types";

export default function Logs() {
  const { toast } = useToast();
  
  const { data: logs = [], isLoading } = useQuery<SystemLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Logs Cleared",
        description: "System logs have been cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Clear Failed",
        description: "Failed to clear system logs",
        variant: "destructive",
      });
    },
  });

  const handleClearLogs = () => {
    clearLogsMutation.mutate();
  };

  const handleExportLogs = () => {
    const logText = logs
      .map(log => {
        const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
        return `[${timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
      })
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "System logs have been downloaded successfully",
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">System Logs</h2>
            <p className="text-slate-600 mt-1">View system activity and operations</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExportLogs} variant="outline" size="sm">
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
            <Button 
              onClick={handleClearLogs}
              disabled={clearLogsMutation.isPending}
              variant="outline" 
              size="sm"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">System Logs</h3>
                <div className="text-sm text-slate-600">
                  {logs.length} entries
                </div>
              </div>
            </div>
            
            <div className="h-full">
              <Terminal logs={logs} isLoading={isLoading} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
