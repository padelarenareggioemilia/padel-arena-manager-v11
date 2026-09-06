// Padel Arena Manager v11 - Core schema 01
// File additivo: non modifica la UI attuale.

export const PAM_ROLES = Object.freeze([
  "super_admin",
  "club_owner",
  "club_admin",
  "reception",
  "collaborator",
  "instructor",
  "organizer",
  "captain",
  "client"
]);

export const PLAYER_LEVELS = Object.freeze([
  "Principiante",
  "Principiante avanzato",
  "Intermedio",
  "Avanzato"
]);

export const ACTIVITY_STATES = Object.freeze([
  "draft",
  "published",
  "organizing",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled"
]);

export const ACTIVITY_TYPES = Object.freeze([
  "free_match",
  "lesson_individual",
  "lesson_pair",
  "lesson_group",
  "guided_match",
  "course",
  "clinic",
  "tournament",
  "championship",
  "event",
  "maintenance",
  "block"
]);

export const BOOKING_MODES = Object.freeze(["organize", "book"]);

export const RESOURCE_TYPES = Object.freeze([
  "court",
  "instructor",
  "room",
  "equipment"
]);

export function newActivity(input = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    clubId: input.clubId ?? null,
    type: input.type ?? "free_match",
    objective: input.objective ?? "play",
    mode: input.mode ?? "organize",
    title: input.title ?? "",
    description: input.description ?? "",
    status: input.status ?? "draft",
    visibility: input.visibility ?? "club",
    startAt: input.startAt ?? null,
    endAt: input.endAt ?? null,
    durationMinutes: input.durationMinutes ?? null,
    minParticipants: input.minParticipants ?? 1,
    maxParticipants: input.maxParticipants ?? 4,
    participantCount: input.participantCount ?? 0,
    resourceIds: input.resourceIds ?? [],
    creatorId: input.creatorId ?? null,
    source: input.source ?? "manual",
    economic: {
      pricePerPerson: input.pricePerPerson ?? null,
      currency: input.currency ?? "EUR",
      chargeStatus: "not_due",
      packagePolicy: null,
      depositPolicy: null
    },
    network: {
      shareable: true,
      radiusKm: null,
      levelMin: null,
      levelMax: null
    },
    createdAt: now,
    updatedAt: now
  };
}

export function newProfile(input = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    birthDate: input.birthDate ?? null,
    birthPlace: input.birthPlace ?? "",
    residenceCity: input.residenceCity ?? "",
    cap: input.cap ?? "",
    province: input.province ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
    photoUrl: input.photoUrl ?? "",
    roles: input.roles ?? ["client"],
    level: input.level ?? null,
    levelStatus: input.levelStatus ?? "self_declared",
    followedClubIds: input.followedClubIds ?? [],
    createdAt: now,
    updatedAt: now
  };
}
