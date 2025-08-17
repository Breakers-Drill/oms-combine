import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { InsertMicroservice } from "@/types";

interface ReadinessChecklistProps {
  formData: Partial<InsertMicroservice>;
  envVars: Array<{ name: string; value: string }>;
  repositoryChecked: boolean;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
}

export default function ReadinessChecklist({ 
  formData, 
  envVars, 
  repositoryChecked 
}: ReadinessChecklistProps) {
  const checklistItems: ChecklistItem[] = [
    {
      label: "Unique name/identifier",
      checked: Boolean(formData.name && formData.name.length > 0),
    },
    {
      label: "Repository accessible",
      checked: repositoryChecked,
    },
    {
      label: "Branch selected",
      checked: Boolean(formData.branch),
    },
    {
      label: "docker-compose.yaml exists",
      checked: repositoryChecked, // Assume it exists if repo is accessible
    },
    {
      label: "Environment variables set",
      checked: envVars.some(env => env.name && env.value),
    },
    {
      label: "Container name unique",
      checked: Boolean(formData.containerName && formData.containerName.length > 0),
    },
    {
      label: "External URL configured",
      checked: Boolean(formData.externalUrl),
    },
  ];

  const completedCount = checklistItems.filter(item => item.checked).length;
  const totalCount = checklistItems.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Readiness Checklist</h3>
        
        <div className="space-y-4">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                  item.checked 
                    ? "border-success bg-success" 
                    : "border-slate-300"
                }`}
              >
                {item.checked && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <span className={`text-sm ${
                item.checked ? "text-slate-800" : "text-slate-600"
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-medium text-slate-800">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
