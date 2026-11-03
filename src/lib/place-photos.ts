// Photos of specific places, shown inside windows rather than in the slideshow.
//
// These deliberately sit outside the numbered rotation in public/photos/. They
// used to be 88.jpg–91.jpg, which meant the only thing stopping them appearing
// in the slideshow was photos.ts happening to skip four numbers — invisible from
// both the folder and the code, and very nearly lost when a batch of new photos
// was appended over the top of them.
//
// Adding one: drop the original in public/photos/raw/places/, compress it by
// hand to roughly 700px on the long edge, save it into public/photos/places/
// under a descriptive name, and add an entry below. The compress script only
// handles the numbered rotation; it skips subdirectories, which is what keeps
// these originals from being swept into it.
//
// `label` is used as both the alt text and, in the RSVP form, the caption.
// `pos` is a CSS object-position, same convention as photos.ts.

export const PLACE_PHOTOS = {
  deerParkHouse:  { src: '/photos/places/deer-park-house.jpg',   label: 'Deer Park Country House', pos: 'center' },
  deerParkAerial: { src: '/photos/places/deer-park-aerial.jpg',  label: 'Deer Park Country House', pos: 'center' },
  dreweArms:      { src: '/photos/places/drewe-arms.jpg',        label: 'The Drewe Arms',          pos: 'center' },
  stAndrews:      { src: '/photos/places/st-andrews-church.jpg', label: "St Andrew's Church",      pos: 'bottom' },
} as const

// Fetched up front so a window never pops its photo in a beat after opening.
export const PLACE_PHOTO_SRCS = Object.values(PLACE_PHOTOS).map(p => p.src)
