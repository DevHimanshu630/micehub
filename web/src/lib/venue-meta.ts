/**
 * Canonical venue metadata: venue types, ownership, and amenities.
 * These values must stay in sync with the pgEnum definitions in db/schema.ts
 * (venue_type, ownership_type) and the text[] amenity slugs.
 */

export const VENUE_TYPE_OPTIONS = [
  "convention_centre",
  "auditorium",
  "exhibition_hall",
  "hotel_ballroom",
  "standalone_hall",
  "other",
] as const;

export type VenueType = (typeof VENUE_TYPE_OPTIONS)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  convention_centre: "Convention Centre",
  auditorium: "Auditorium",
  exhibition_hall: "Exhibition Hall",
  hotel_ballroom: "Hotel Ballroom",
  standalone_hall: "Standalone Hall",
  other: "Other",
};

export const OWNERSHIP_OPTIONS = [
  "government",
  "private",
  "hotel_brand",
  "other",
] as const;

export type Ownership = (typeof OWNERSHIP_OPTIONS)[number];

export const OWNERSHIP_LABELS: Record<Ownership, string> = {
  government: "Government",
  private: "Private",
  hotel_brand: "Hotel Brand",
  other: "Other",
};

export const AMENITY_OPTIONS = [
  "catering",
  "av_equipment",
  "video_conferencing",
  "parking",
  "wifi",
  "accommodation",
  "valet",
  "stage",
] as const;

export type Amenity = (typeof AMENITY_OPTIONS)[number];

export const AMENITY_LABELS: Record<Amenity, string> = {
  catering: "In-house Catering",
  av_equipment: "AV Equipment",
  video_conferencing: "Video Conferencing",
  parking: "Parking",
  wifi: "High-speed Wi-Fi",
  accommodation: "On-site Accommodation",
  valet: "Valet Parking",
  stage: "Stage & Backdrop",
};

// Per-space offerings (more granular than property-level amenities — these
// describe a specific hall/room).
export const SPACE_OFFERING_OPTIONS = [
  "projector",
  "sound_system",
  "stage",
  "natural_light",
  "pillarless",
  "dance_floor",
  "air_conditioning",
  "wheelchair_access",
  "breakout_rooms",
  "podium",
] as const;

export type SpaceOffering = (typeof SPACE_OFFERING_OPTIONS)[number];

export const SPACE_OFFERING_LABELS: Record<SpaceOffering, string> = {
  projector: "Projector & Screen",
  sound_system: "Sound System",
  stage: "Stage",
  natural_light: "Natural Light",
  pillarless: "Pillarless Hall",
  dance_floor: "Dance Floor",
  air_conditioning: "Air Conditioning",
  wheelchair_access: "Wheelchair Access",
  breakout_rooms: "Breakout Rooms",
  podium: "Podium",
};

export function spaceOfferingLabel(value: string): string {
  return SPACE_OFFERING_LABELS[value as SpaceOffering] ?? value;
}

export function venueTypeLabel(value: string): string {
  return VENUE_TYPE_LABELS[value as VenueType] ?? "Venue";
}

export function ownershipLabel(value: string): string {
  return OWNERSHIP_LABELS[value as Ownership] ?? value;
}

export function amenityLabel(value: string): string {
  return AMENITY_LABELS[value as Amenity] ?? value;
}
