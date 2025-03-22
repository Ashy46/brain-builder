"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About Brain Builder</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Brain Builder was created with a simple yet powerful mission: to revolutionize how people learn and understand complex information. We believe that visual learning and connection-making are key to deeper understanding and better retention.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-medium mb-2">Visual Knowledge Mapping</h3>
                <p className="text-muted-foreground">
                  Create interactive mind maps and knowledge graphs that help you visualize connections between different concepts and ideas.
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-medium mb-2">Smart Connections</h3>
                <p className="text-muted-foreground">
                  Our intelligent system helps you discover and create meaningful connections between related topics, enhancing your understanding.
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-medium mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor your learning journey with detailed progress tracking and insights into your knowledge growth.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-4 text-muted-foreground">
              <li>Intuitive and user-friendly interface</li>
              <li>Powerful visualization tools</li>
              <li>Collaborative learning features</li>
              <li>Regular updates and improvements</li>
              <li>Dedicated support team</li>
            </ul>
          </section>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/dashboard">Start Your Learning Journey</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 