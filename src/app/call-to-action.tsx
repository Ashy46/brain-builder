import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
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
  );
}
