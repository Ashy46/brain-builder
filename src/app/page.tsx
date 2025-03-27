import { ScrollProgress } from "@/components/magicui/scroll-progress";

import { Features } from "./features";
import { CallToAction } from "./call-to-action";
import { Hero } from "./hero";

export default function LandingPage() {
  return (
    <>
      <ScrollProgress color="primary" />

      <Hero />
      <Features />
      <CallToAction />
    </>
  );
}
