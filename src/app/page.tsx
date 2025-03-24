"use client";

import Link from "next/link";

import { ArrowRight, Brain, BrainCircuit, Target, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ScrollProgress } from "@/components/magicui/scroll-progress";

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

export default function LandingPage() {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ScrollProgress color="primary" />

      <div className="flex flex-col min-h-screen">
        <section className="flex flex-col items-center justify-center px-4 h-screen text-center">
          <div className="container max-w-4xl items-center justify-center">
            <BrainCircuit className="size-16 text-primary mx-auto mb-4 p-2 rounded-2xl bg-primary/10" />

            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Build Intelligent Agents Visually
            </h1>

            <p className="max-w-2xl mx-auto mb-8 text-xl text-muted-foreground">
              Create powerful AI agents through an intuitive visual interface.
              Design complex behaviors, define custom workflows, and bring your
              automation ideas to life - no coding required.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features" onClick={scrollToFeatures}>
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </section>

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

        <section className="py-24 px-4 bg-secondary/15">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Automation?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-muted-foreground">
              Create your first agent in minutes. No coding required.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Building Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
