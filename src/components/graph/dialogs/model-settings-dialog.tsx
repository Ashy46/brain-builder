import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LLMConfig {
  model: "gpt-4" | "gpt-4o-mini";
  temperature: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  topP: number;
}

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
}

export function ModelSettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: ModelSettingsDialogProps) {
  const handleSave = () => {
    onConfigChange(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select
              value={config.model}
              onValueChange={(value: "gpt-4" | "gpt-4o-mini") =>
                onConfigChange({ ...config, model: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4-Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Temperature</label>
              <span className="text-sm text-muted-foreground">
                {config.temperature}
              </span>
            </div>
            <Slider
              value={[config.temperature]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={(value: number[]) =>
                onConfigChange({ ...config, temperature: value[0] })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Max Tokens</label>
              <span className="text-sm text-muted-foreground">
                {config.maxTokens}
              </span>
            </div>
            <Slider
              value={[config.maxTokens]}
              min={0}
              max={8000}
              step={1}
              onValueChange={(value: number[]) =>
                onConfigChange({ ...config, maxTokens: value[0] })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Frequency Penalty</label>
              <span className="text-sm text-muted-foreground">
                {config.frequencyPenalty}
              </span>
            </div>
            <Slider
              value={[config.frequencyPenalty]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value: number[]) =>
                onConfigChange({ ...config, frequencyPenalty: value[0] })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Presence Penalty</label>
              <span className="text-sm text-muted-foreground">
                {config.presencePenalty}
              </span>
            </div>
            <Slider
              value={[config.presencePenalty]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value: number[]) =>
                onConfigChange({ ...config, presencePenalty: value[0] })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Top P</label>
              <span className="text-sm text-muted-foreground">{config.topP}</span>
            </div>
            <Slider
              value={[config.topP]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value: number[]) =>
                onConfigChange({ ...config, topP: value[0] })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 