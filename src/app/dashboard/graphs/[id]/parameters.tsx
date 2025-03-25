import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Parameter {
  id: string;
  name: string;
  value: string;
}

interface AnalysisMethod {
  id: string;
  name: string;
  type: string;
}

interface ParametersProps {
  initialParameters?: {
    patientParameters: Parameter[];
    analysisMethods: AnalysisMethod[];
  };
  onParametersChange: (parameters: {
    patientParameters: Parameter[];
    analysisMethods: AnalysisMethod[];
  }) => void;
}

export function Parameters({ initialParameters, onParametersChange }: ParametersProps) {
  const [patientParameters, setPatientParameters] = useState<Parameter[]>(
    initialParameters?.patientParameters || [
      { id: "1", name: "Age", value: "" },
      { id: "2", name: "Gender", value: "male" },
    ]
  );

  const [analysisMethods, setAnalysisMethods] = useState<AnalysisMethod[]>(
    initialParameters?.analysisMethods || [
      { id: "1", name: "Standard Analysis", type: "standard" },
    ]
  );

  // Update state when initialParameters changes
  useEffect(() => {
    if (initialParameters) {
      setPatientParameters(initialParameters.patientParameters);
      setAnalysisMethods(initialParameters.analysisMethods);
    }
  }, [initialParameters]);

  const handleParameterChange = (id: string, field: "name" | "value", newValue: string) => {
    setPatientParameters(prev => {
      const updated = prev.map(param =>
        param.id === id ? { ...param, [field]: newValue } : param
      );
      onParametersChange({ patientParameters: updated, analysisMethods });
      return updated;
    });
  };

  const handleMethodChange = (id: string, field: "name" | "type", newValue: string) => {
    setAnalysisMethods(prev => {
      const updated = prev.map(method =>
        method.id === id ? { ...method, [field]: newValue } : method
      );
      onParametersChange({ patientParameters, analysisMethods: updated });
      return updated;
    });
  };

  const addParameter = () => {
    const newParam = {
      id: Date.now().toString(),
      name: "",
      value: "",
    };
    setPatientParameters(prev => {
      const updated = [...prev, newParam];
      onParametersChange({ patientParameters: updated, analysisMethods });
      return updated;
    });
  };

  const addMethod = () => {
    const newMethod = {
      id: Date.now().toString(),
      name: "",
      type: "standard",
    };
    setAnalysisMethods(prev => {
      const updated = [...prev, newMethod];
      onParametersChange({ patientParameters, analysisMethods: updated });
      return updated;
    });
  };

  const removeParameter = (id: string) => {
    setPatientParameters(prev => {
      const updated = prev.filter(param => param.id !== id);
      onParametersChange({ patientParameters: updated, analysisMethods });
      return updated;
    });
  };

  const removeMethod = (id: string) => {
    setAnalysisMethods(prev => {
      const updated = prev.filter(method => method.id !== id);
      onParametersChange({ patientParameters, analysisMethods: updated });
      return updated;
    });
  };

  return (
    <Card className="w-[350px] h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle>Analysis Configuration</CardTitle>
        <CardDescription>
          Configure patient parameters and analysis methods
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Patient Parameters</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addParameter}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 pb-6">
              {patientParameters.map((param) => (
                <div key={param.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={(e) => handleParameterChange(param.id, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => handleParameterChange(param.id, "value", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParameter(param.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Analysis Methods</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addMethod}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {analysisMethods.map((method) => (
                <div key={method.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Method name"
                      value={method.name}
                      onChange={(e) => handleMethodChange(method.id, "name", e.target.value)}
                    />
                    <Select
                      value={method.type}
                      onValueChange={(value) => handleMethodChange(method.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMethod(method.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 