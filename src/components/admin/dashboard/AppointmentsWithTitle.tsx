"use client";

import { useState, useCallback, useEffect } from "react";
import AppointmentsList from "./AppointmentsList";

const BASE_TITLE = "Dashboard · VANTTAGE";

export default function AppointmentsWithTitle() {
  const [pendingCount, setPendingCount] = useState(0);

  const handlePendingCount = useCallback((n: number) => {
    setPendingCount(n);
  }, []);

  useEffect(() => {
    document.title =
      pendingCount > 0 ? `(${pendingCount}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [pendingCount]);

  return <AppointmentsList onPendingCount={handlePendingCount} />;
}
