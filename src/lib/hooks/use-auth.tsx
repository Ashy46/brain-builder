"use client";

import * as React from "react";

import { AuthContext } from "@/lib/providers/auth";

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
