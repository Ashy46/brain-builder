"use client";

import Link from "next/link";

import { ArrowRight, BrainCircuit } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
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
  );
}
