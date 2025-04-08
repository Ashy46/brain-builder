"use client";

import { useParams } from "next/navigation";

import { Graph } from "./graph";

export default function GraphPage() {
  const { id } = useParams();

  return (
    <>
      <Graph />
    </>
  );
}
