import { useMutation } from "@tanstack/react-query";
import { Play, Square, Trash2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ConfirmationModal from "@/components/confirmation-modal";
import LoadingModal from "@/components/loading-modal";
import { useState } from "react";
import type { Microservice } from "@/types";

interface ServiceCardProps {
  service: Microservice;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const deployMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/microservices/${service.id}/deploy`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microservices"] });
      toast({
        title: "Deploy Initiated",
        description: `Deploy process started for ${service.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Deploy Failed",
        description: "Failed to initiate deploy process",
        variant: "destructive",
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/microservices/${service.id}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microservices"] });
      toast({
        title: "Stop Initiated",
        description: `Stop process started for ${service.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Stop Failed",
        description: "Failed to stop service",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/microservices/${service.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microservices"] });
      toast({
        title: "Delete Initiated",
        description: `Delete process started for ${service.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const handleDeploy = () => {
    deployMutation.mutate();
  };

  const handleStop = () => {
    setShowStopConfirm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmStop = () => {
    setShowStopConfirm(false);
    stopMutation.mutate();
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate();
  };

  return (
    <>
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">{service.name}</h3>
              <p className="text-sm text-slate-600 mt-1">{service.description || "No description"}</p>
            </div>
            <Badge 
              variant={service.status === "running" ? "default" : "secondary"}
              className={service.status === "running" 
                ? "bg-success/10 text-success hover:bg-success/20" 
                : "bg-error/10 text-error hover:bg-error/20"
              }
            >
              {service.status === "running" ? "Running" : "Stopped"}
            </Badge>
          </div>
          
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Repository:</span>
              <span className="text-slate-800 truncate ml-2">{service.repository}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Branch:</span>
              <span className="text-slate-800">{service.branch}</span>
            </div>
            {service.externalUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">External URL:</span>
                <span className="text-slate-800 truncate ml-2">{service.externalUrl}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleDeploy}
              disabled={deployMutation.isPending}
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              size="sm"
            >
              <Rocket className="mr-1 h-3 w-3" />
              Deploy
            </Button>
            <Button 
              onClick={handleStop}
              disabled={service.status === "stopped" || stopMutation.isPending}
              variant="outline"
              className="flex-1 border-warning text-warning hover:bg-warning hover:text-white"
              size="sm"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="outline"
              className="border-error text-error hover:bg-error hover:text-white"
              size="sm"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        onConfirm={confirmStop}
        title="Stop Service"
        message={`Are you sure you want to stop ${service.name}?`}
        confirmText="Yes, Stop"
        isLoading={stopMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Service"
        message={`Are you sure you want to permanently delete ${service.name}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />

      <LoadingModal
        isOpen={deployMutation.isPending}
        title="Deploying Service"
        message={`Deploying ${service.name}...`}
      />
    </>
  );
}
