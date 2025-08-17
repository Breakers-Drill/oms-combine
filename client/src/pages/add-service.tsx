import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReadinessChecklist from "@/components/readiness-checklist";
import { insertMicroserviceSchema } from "@/types";
import type { InsertMicroservice } from "@/types";

type EnvVar = {
  name: string;
  value: string;
};

export default function AddService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ name: "", value: "" }]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [repositoryChecked, setRepositoryChecked] = useState(false);

  const form = useForm<InsertMicroservice>({
    resolver: zodResolver(insertMicroserviceSchema),
    defaultValues: {
      name: "",
      description: "",
      repository: "",
      branch: "",
      account: "",
      containerName: "",
      externalUrl: "",
      environmentVariables: {},
      status: "stopped",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: InsertMicroservice) => apiRequest("POST", "/api/microservices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microservices"] });
      toast({
        title: "Service Created",
        description: "Microservice has been successfully registered",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create microservice",
        variant: "destructive",
      });
    },
  });

  const checkRepositoryMutation = useMutation({
    mutationFn: (repository: string) => apiRequest("POST", "/api/repository/check", { repository }),
    onSuccess: (response: any) => {
      const data = response.json();
      setAvailableBranches(data.branches || []);
      setRepositoryChecked(true);
      toast({
        title: "Repository Check Complete",
        description: "Repository is accessible and branches loaded",
      });
    },
    onError: () => {
      toast({
        title: "Repository Check Failed",
        description: "Could not access the repository",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMicroservice) => {
    const envVarObject = envVars.reduce((acc, envVar) => {
      if (envVar.name && envVar.value) {
        acc[envVar.name] = envVar.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const serviceData = {
      ...data,
      environmentVariables: envVarObject,
    };

    createServiceMutation.mutate(serviceData);
  };

  const handleCheckRepository = () => {
    const repository = form.getValues("repository");
    if (repository) {
      checkRepositoryMutation.mutate(repository);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { name: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    if (envVars.length > 1) {
      setEnvVars(envVars.filter((_, i) => i !== index));
    }
  };

  const updateEnvVar = (index: number, field: "name" | "value", value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const watchedValues = form.watch();

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Add Service</h2>
            <p className="text-slate-600 mt-1">Register a new microservice</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Service Configuration</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., auth-service" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="containerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Container Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., auth_container" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of the service" 
                                rows={3} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-md font-medium text-slate-800 mb-4">Repository Configuration</h4>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="repository"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Repository URL *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      placeholder="https://github.com/username/repo" 
                                      className="pr-20"
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      onClick={handleCheckRepository}
                                      disabled={!field.value || checkRepositoryMutation.isPending}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 text-xs"
                                    >
                                      {checkRepositoryMutation.isPending ? "Checking..." : "Check"}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="account"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select account..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="github-company">GitHub - company</SelectItem>
                                      <SelectItem value="gitlab-enterprise">GitLab - enterprise</SelectItem>
                                      <SelectItem value="bitbucket-team">Bitbucket - team</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="branch"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Branch *</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    disabled={!repositoryChecked}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select branch..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableBranches.map((branch) => (
                                        <SelectItem key={branch} value={branch}>
                                          {branch}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-slate-800">Environment Variables</h4>
                          <Button type="button" onClick={addEnvVar} variant="outline" size="sm">
                            <Plus className="mr-1 h-3 w-3" />
                            Add Variable
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {envVars.map((envVar, index) => (
                            <div key={index} className="grid grid-cols-5 gap-3">
                              <div className="col-span-2">
                                <Input
                                  placeholder="Variable name"
                                  value={envVar.name}
                                  onChange={(e) => updateEnvVar(index, "name", e.target.value)}
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  placeholder="Value"
                                  value={envVar.value}
                                  onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                                />
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  onClick={() => removeEnvVar(index)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-error hover:bg-error hover:text-white"
                                  disabled={envVars.length === 1}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-md font-medium text-slate-800 mb-4">External Access</h4>
                        <FormField
                          control={form.control}
                          name="externalUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>External URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://service.company.com" {...field} />
                              </FormControl>
                              <p className="text-xs text-slate-500 mt-1">URL for reverse proxy configuration</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex space-x-4">
                          <Button 
                            type="submit" 
                            disabled={createServiceMutation.isPending}
                            className="bg-primary text-white hover:bg-primary/90"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Service
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setLocation("/")}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <ReadinessChecklist 
                formData={watchedValues}
                envVars={envVars}
                repositoryChecked={repositoryChecked}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
