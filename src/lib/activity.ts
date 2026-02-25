import prisma from "@/lib/prisma";
import type { ActivityLogType } from "@/generated/prisma";

interface LogActivityParams {
  tripId: string;
  userId?: string;
  type: ActivityLogType;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Fire-and-forget activity logging. Never throws — errors are caught and logged.
 */
export function logActivity(params: LogActivityParams): void {
  prisma.activityLog
    .create({
      data: {
        tripId: params.tripId,
        userId: params.userId ?? null,
        type: params.type,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? undefined,
      },
    })
    .catch((err) => {
      console.error("Failed to log activity:", err);
    });
}
