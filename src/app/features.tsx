import { Brain, Zap, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="transition-all hover:scale-102">
      <CardContent>
        <div className="inline-block p-2 mb-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-secondary/10">
      <div className="container mx-auto h-screen flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Brain Builder?
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="Visual Agent Builder"
            description="Design complex AI agents through an intuitive drag-and-drop interface. No coding required to create sophisticated automation workflows."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="JSON Output"
            description="Generate JSON output for your agents. This allows you to use your agents in other applications that support JSON input."
          />
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Conditional Logic"
            description="Define conditional logic for your agents. This allows you to create agents that can make decisions based on the input they receive."
          />
        </div>
      </div>
    </section>
  );
}
