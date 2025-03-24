"use client";

import { useState, useEffect, useRef } from "react";
import { Graph, GraphRef } from "@/app/graph/graph";
import { CodeEditor } from "@/app/graph/code-editor";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Target, Zap } from "lucide-react";
import Link from "next/link";

const defaultJson = {
  id: "1",
  label: "Root",
  children: [
    {
      id: "2",
      label: "Child 1",
      children: [
        {
          id: "4",
          label: "Grandchild 1",
        },
      ],
    },
    {
      id: "3",
      label: "Child 2",
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-4xl">
          <div className="inline-block p-2 mb-4 bg-secondary/30 rounded-full">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Build Your Brain,{" "}
            <span className="text-primary">One Connection at a Time</span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-muted-foreground">
            Transform your learning experience with our innovative knowledge
            mapping tool. Connect ideas, enhance understanding, and unlock your
            mind's full potential.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Brain Builder?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="Visual Learning"
              description="Create beautiful mind maps and knowledge graphs that help you understand complex topics effortlessly."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Quick Connections"
              description="Instantly connect related concepts and ideas, strengthening your understanding and recall."
            />
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Goal-Oriented"
              description="Track your learning progress and achieve your educational goals with our smart tracking system."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-muted-foreground">
            Join thousands of learners who have already enhanced their
            understanding using Brain Builder.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

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
    <div className="p-6 rounded-lg bg-card border transition-all hover:scale-105">
      <div className="inline-block p-2 mb-4 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
