"use client";

import { useEffect } from "react";
import { initMonitoring } from "@/lib/monitoring";

export function ClientMonitoring() {
  useEffect(() => {
    initMonitoring();
  }, []);

  return null;
}

