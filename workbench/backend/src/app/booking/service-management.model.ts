export type ActivityActionsRequest = {
  duration: number,
  plannedDurationInMinutes: number,
  resolution: string | null,
  startDateTime: string | null,
  team: string | null,
  technician: Partial<{
    id: string | null,
    code: string | null,
    externalId: string | null,
  }>,
  travelTimeFromInMinutes: number,
  travelTimeToInMinutes: number,
  unit: string | null,
}
