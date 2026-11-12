// The Deer Park rooms we can allocate, and what they cost.
//
// Single source of truth. These four lines used to be copy-pasted into
// page.tsx, RsvpForm.tsx, rsvp-email.ts and AdminDashboard.tsx, which meant a
// price change had to be made in four places and a guest could be shown two
// different figures on two different pages. Change a price here and it moves
// everywhere: the Accommodation window, the RSVP toggles, the confirmation
// email and the admin capacity counters.
//
// `capacity` is how many of each the venue actually has, used by the admin
// ROOMS cards. `shortLabel` is for those cards and the invite row badges.

export interface RoomInfo {
  label: string
  shortLabel: string
  price: string
  capacity: number
}

export const ROOM_TYPES = {
  main_house_double: { label: 'Main House Double', shortLabel: 'MH DBL',    price: '£150 per night',  capacity: 14 },
  garden_double:     { label: 'Garden Double',     shortLabel: 'GDN DBL',   price: '£150 per night',  capacity: 14 },
  garden_single:     { label: 'Garden Single',     shortLabel: 'GDN SGL',   price: '£75 per night',   capacity: 2  },
  treehouse:         { label: 'The Treehouse',     shortLabel: 'TREEHOUSE', price: '£6967 per night', capacity: 1  },
} satisfies Record<string, RoomInfo>

export type RoomType = keyof typeof ROOM_TYPES

export const ROOM_TYPE_ENTRIES = Object.entries(ROOM_TYPES) as [RoomType, RoomInfo][]

// Room keys arrive from the room_counts jsonb blob, so they're only strings as
// far as the compiler knows. Returns undefined for a key we no longer recognise
// rather than throwing, which every caller already handles.
export function roomInfo(key: string): RoomInfo | undefined {
  return (ROOM_TYPES as Record<string, RoomInfo>)[key]
}
