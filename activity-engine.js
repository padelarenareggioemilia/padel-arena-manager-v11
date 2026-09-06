// Padel Arena Manager v11 - Activity Engine 01

import { ACTIVITY_STATES } from "./schema.js";

export function isComplete(activity) {
  return Number(activity.participantCount || 0) >= Number(activity.minParticipants || 1);
}

export function canConfirm(activity, resourcesAvailable = true) {
  if (!resourcesAvailable) return false;
  if (activity.mode === "book") return true;
  return isComplete(activity);
}

export function nextState(activity, resourcesAvailable = true) {
  if (activity.status === "cancelled" || activity.status === "completed") {
    return activity.status;
  }

  if (activity.mode === "book" && resourcesAvailable) {
    return "confirmed";
  }

  if (activity.mode === "organize") {
    return canConfirm(activity, resourcesAvailable) ? "confirmed" : "organizing";
  }

  return activity.status || "draft";
}

export function transition(activity, target) {
  if (!ACTIVITY_STATES.includes(target)) {
    throw new Error(`Stato attività non valido: ${target}`);
  }

  return {
    ...activity,
    status: target,
    updatedAt: new Date().toISOString()
  };
}

export function shouldCharge(activity) {
  // Regola congelata: nessun addebito definitivo prima della conferma.
  return ["confirmed", "in_progress", "completed"].includes(activity.status);
}

export function releaseAfterParticipantExit(activity) {
  const nextCount = Math.max(0, Number(activity.participantCount || 0) - 1);
  const updated = { ...activity, participantCount: nextCount };

  if (activity.mode === "organize" && nextCount < Number(activity.minParticipants || 1)) {
    updated.status = "organizing";
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}
