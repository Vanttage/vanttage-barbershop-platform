-- CreateIndex
CREATE INDEX "appointments_reminder24hSentAt_startsAt_status_idx" ON "appointments"("reminder24hSentAt", "startsAt", "status");

-- CreateIndex
CREATE INDEX "appointments_reminder1hSentAt_startsAt_status_idx" ON "appointments"("reminder1hSentAt", "startsAt", "status");

-- CreateIndex
CREATE INDEX "appointments_reviewRequestSentAt_endsAt_status_idx" ON "appointments"("reviewRequestSentAt", "endsAt", "status");

-- CreateIndex
CREATE INDEX "barber_schedules_barberId_dayOfWeek_isAvailable_idx" ON "barber_schedules"("barberId", "dayOfWeek", "isAvailable");
