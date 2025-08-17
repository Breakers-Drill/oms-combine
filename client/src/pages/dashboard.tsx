import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Server, CheckCircle, StopCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ServiceCard from "@/components/service-card";
import { queryClient } from "@/lib/queryClient";
import type { Microservice } from "@/types";

export default function Dashboard() {
  const { data: services = [], isLoading } = useQuery<Microservice[]>({
    queryKey: ["/api/microservices"],
  });

  const runningServices = services.filter(s => s.status === "running");
  const stoppedServices = services.filter(s => s.status === "stopped");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/microservices"] });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
              <p className="text-slate-600 mt-1">Manage your microservices</p>
            </div>
            <Button onClick={handleRefresh} disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg h-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
            <p className="text-slate-600 mt-1">Manage your microservices</p>
          </div>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Total Services</p>
                    <p className="text-2xl font-semibold text-slate-800">{services.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Running</p>
                    <p className="text-2xl font-semibold text-slate-800">{runningServices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-error/10 rounded-lg">
                    <StopCircle className="h-5 w-5 text-error" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Stopped</p>
                    <p className="text-2xl font-semibold text-slate-800">{stoppedServices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Errors</p>
                    <p className="text-2xl font-semibold text-slate-800">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Server className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No microservices found</h3>
              <p className="text-slate-600 mb-4">Get started by adding your first microservice.</p>
              <Button>Add Service</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
