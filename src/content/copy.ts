/* ============================================================================
 *
 *   WEBSITE WORDS
 *   Everything guests read on the site lives in this one file.
 *
 *   ----------------------------------------------------------------------
 *   HOW TO EDIT  (you only ever change the words, nothing else)
 *   ----------------------------------------------------------------------
 *
 *   Every bit of text sits between two backticks, like this:
 *
 *       title: `Let us know if you can make it!`,
 *                ^----------- edit this bit -----------^
 *
 *   Rules:
 *     1. Only change the words BETWEEN the backticks.
 *     2. Leave the backticks ` and the comma , exactly where they are.
 *     3. Leave the word before the colon alone (that's the label, not text).
 *     4. Apostrophes are completely fine. Write don't, can't, Bechan's.
 *     5. To make a phrase stand out in darker text, wrap it in *stars*:
 *            `the big day is *Saturday 12th June* and we can't wait`
 *     6. [itinerary] turns into a link to the itinerary page. Keep it as is.
 *     7. [github] turns into the link to the code. Keep it as is.
 *
 *   ABOUT LINE BREAKS
 *     Longer text is split across several lines so you never have to scroll
 *     sideways. The website ignores those breaks and joins everything back
 *     into flowing paragraphs, so break lines wherever you like, or don't
 *     bother. Pressing Enter does NOT create a new paragraph on the site.
 *
 *   If something looks like code rather than words, leave it alone and ask.
 *
 * ========================================================================= */

export const COPY = {

  /* ======================= HOME / WELCOME POP-UP ======================= */
  home: {
    invitedLine: `You are cordially invited to the wedding of`,

    names: `Bechan & Ethan`,

    photoDate: `SATURDAY · 12TH JUNE 2027`,

    photoVenue: `Deer Park Country House · Devon, England`,

    rsvpButton: `RSVP NOW`,
  },

  /* ============================ RSVP PAGE ============================= */
  rsvp: {
    title: `Let us know if you can make it!`,

    saturday: `
      You can read the exact details in the [itinerary], but the big day is on
      *Saturday 12th June at Deer Park Country House, Honiton, starting at 1:30pm*.
      That'll be the main ceremony followed by the whole shebang.
    `,

    friday: `
      We will be having a much smaller (legal) wedding ceremony the evening
      before, *5pm Friday 11th June, at St Andrew's Church in Broadhembury
      village*. You are welcome to join us if you are in the area (and want to
      watch us get married twice!). We will be having drinks and some food at
      the Drewe Arms after the ceremony. The Drewe Arms is not only a
      30 second walk away from the church, but our panel of incredibly biased
      judges do regard it as the best pub in Devon, and possibly the World.
    `,

    // PLEASE DON'T TYPE DALE & CATHERINE'S ADDRESS HERE. This file is public on
    // the internet. The site prints the real address underneath this paragraph,
    // pulled from the private database, so just lead into it and stop.
    sundayBeforeAddress: `
      On Sunday 13th June Bechan's parents Dale & Catherine have very kindly
      offered to host a BBQ brunch back at their family home in Broadhembury;
      the address is:
    `,

    sundayAfterAddress: `
      There is a pool so bring your swimmers for a dip to cure your sore head.
      We don't want to make any premature promises but a hog roast has been
      thrown around as a possibility if enough folk are coming, so let us know
      if you fancy it.
    `,

    closing: `
      We can't wait to welcome you to Devon!
    `,

    // Shown above the room yes/no toggles, only for guests who have a room
    roomsIntro: `
      You lucky things! We have limited rooms at Deer Park for the Saturday
      night but we love you so much / want you to stay up late so we
      prioritised giving you a room. Please brag loudly at the wedding about
      how much better you are than the other guests and how much more we like
      you. We've put the price per night of the room beside the input, but if
      you'd rather sort out your own accommodation that's equally no issue.
      Just let us know and we'll give someone else the bragging rights.
    `,

    // Labels on the yes/no questions (short, so they stay on one line)
    saturdayQuestion: `Saturday 12th June — Deer Park Country House?`,
    fridayQuestion: `Friday 11th June — St Andrew's Church, Broadhembury?`,
    sundayQuestion: `Sunday 13th June — BBQ brunch at Bechan's family home?`,
    dietaryLabel: `DIETARY REQUIREMENTS (IF ANY)`,
    dietaryPlaceholder: `e.g. vegetarian, nut allergy, gluten free…`,
    emailLabel: `EMAIL — WE'LL SEND YOUR RSVP CONFIRMATION HERE`,

    // Buttons
    sendButton: `SEND RSVP`,
    updateButton: `UPDATE RSVP`,
    updateMyRsvpButton: `UPDATE MY RSVP`,

    // The confirmation box after someone submits
    confirmSentTitle: `RSVP RECEIVED`,
    confirmUpdatedTitle: `RSVP UPDATED`,
    confirmSentHeadline: `Thanks! We can't wait to see you.`,
    confirmUpdatedHeadline: `Got it, we've updated your answers.`,

    confirmWithEmail: `
      A confirmation is on its way to your inbox. Your answers are below, and
      you can change them any time.
    `,

    confirmWithoutEmail: `
      Your answers are saved and shown below. You can come back and change
      them any time.
    `,

    summaryIntro: `Here's what we've got on file for you:`,
  },

  /* ========================= ACCOMMODATION PAGE ======================== */
  stay: {
    titleWithRoom: `Accommodation`,
    titleWithoutRoom: `Places to Stay`,
    reservedBadge: `RESERVED FOR YOU`,

    reservedIntro: `
      Congrats! We've already reserved a room for you at Deer Park on the night
      of Saturday 12th June 2027.
    `,

    rateBoth: `
      Your rooms are available at the nightly rate of £150.00 (to include
      breakfast) for the double, and £75.00 (to include breakfast) for the
      single.
    `,

    rateDouble: `
      Your room is available at the nightly rate of £150.00 (to include
      breakfast).
    `,

    rateSingle: `
      Your room is available at the nightly rate of £75.00 (to include
      breakfast).
    `,

    rateClosing: `
      The room is yours if you'd like it, just confirm via your RSVP.
    `,

    elsewhereHeading: `Prefer to stay elsewhere?`,

    elsewhereIntro: `No problem at all. A few other options nearby:`,

    noRoomIntro: `
      We don't have a room booked for you at Deer Park, but there's plenty of
      lovely accommodation nearby in and around Honiton. Here are a few options
      to get you started.
    `,

    alsoWorthALook: `
      There are plenty of Airbnbs dotted around the area if you'd prefer, and
      if you'd rather stay somewhere bigger, Exeter and Taunton are the nearest
      larger towns with a wider range of places to stay.
    `,

    // The list of other places to stay. Price is just £, ££ or £££.
    options: [
      {
        name: `The Pig at Combe`,
        price: `£££`,
        tag: `The splurge`,
        mapQuery: `The Pig at Combe, Gittisham, Honiton`,
        description: `
          The boujee option, and a very short drive from Deer Park. Beautiful
          grounds and a fantastic restaurant. Note they
          require a minimum 2-night stay on weekends.
        `,
      },
      {
        name: `The Tumbling Weir Hotel`,
        price: `££`,
        tag: `In town`,
        mapQuery: `The Tumbling Weir Hotel, Ottery St Mary`,
        description: `
          A comfortable, mid-range option with a restaurant attached.
        `,
      },
      {
        name: `Premier Inn Honiton`,
        price: `£`,
        tag: `Cheap and cheerful`,
        mapQuery: `Premier Inn Honiton`,
        description: `
          Reliable, no-frills, and right in Honiton. The safe bet if you just
          need a bed and a shower.
        `,
      },
      {
        name: `Buckley Farmhouse`,
        price: `££`,
        tag: `Country B&B`,
        mapQuery: `Buckley Farmhouse, Devon`,
        description: `
          A charming farmhouse B&B with excellent reviews, a little further out.
        `,
      },
      {
        name: `The White Hart Inn`,
        price: `££`,
        tag: `Village inn`,
        mapQuery: `The White Hart Inn, Wilmington, Honiton`,
        description: `
          A cosy village inn a short drive away, in Wilmington.
        `,
      },
    ],
  },

  /* =========================== ITINERARY PAGE ========================== */
  itinerary: {
    title: `The Weekend`,

    disclaimer: `
      Saturday times below (other than the ceremony itself) and the Sunday time
      are our best guesstimates, not gospel!
    `,

    mainEventBadge: `MAIN EVENT`,
    optionalBadge: ` OPTIONAL IF YOU CAN MAKE IT`,

    lunchWarning: `
      WE WOULD WANT THIS WARNING IF WE WERE GUESTS, SO WE'RE GIVING IT TO YOU:
      EAT LUNCH BEFOREHAND. YOU WON'T GET A PROPER FEED UNTIL THE EVENING.
    `,

    friday: {
      location: `St Andrew's Church, Broadhembury`,
      events: [
        { time: `5:00pm`, event: `Legal wedding ceremony` },
        { time: `Evening`, event: `Dinner & drinks at The Drewe Arms, Broadhembury` },
      ],
    },

    saturday: {
      location: `Deer Park Country House, Honiton`,
      events: [
        { time: `1:30pm`, event: `Wedding Ceremony Time` },
        { time: `2:30pm`, event: `Reception Drinks Time` },
        { time: `4:00pm`, event: `Dinner Time` },
        { time: `8:30pm`, event: `Party time` },
        { time: `9:30pm`, event: `Evening food top up for extra dancing fuel` },
        {
          time: `Midnight`,
          event: `
            Carriages. Move over from the dancefloor to the nightcap bar in the
            main house if you're hardcore
          `,
        },
      ],
    },

    sunday: {
      // Address comes from the database, so this is only the fallback wording
      locationFallback: `Bechan's family home, Broadhembury`,
      events: [
        { time: `11:00am`, event: `BBQ brunch and pool time` },
      ],
    },
  },

  /* ============================ TRAVEL PAGE ============================ */
  travel: {
    title: `Getting There`,

    britainHeading: `I'm coming from London / other places in Britain`,

    britainTrains: `
      The nearest and easiest train station to the events is Tiverton Parkway,
      but there's also Honiton. For Londoners, your best bet if
      you're not driving is the Paddington train to Tiverton Parkway
      and a taxi from there.
    `,

    britainWales: `
      For the Welsh contingent, it's the M4 east and then the M5 south at
      Bristol, which is about two and a half hours from Cardiff if the traffic
      behaves. The Severn tolls have been gone since 2018 so you don't even
      need to dig out the loose change any more. On the train it's Cardiff
      Central to Bristol Temple Meads, then change there for Tiverton Parkway.
    `,

    irelandHeading: `I'm coming from Belfast / other places in Ireland`,

    ireland: `
      The 2 closest airports to Deer Park are Bristol and Exeter. In our
      experience it's normally easiest and cheapest to get a SleazyJet flight
      from Belfast to Bristol and a taxi from Bristol. Although Ryanair also do
      flights from Dublin to Bristol or Dublin to Exeter. For the more pampered
      passenger, we know you can get Aer Lingus or British Airways flights from
      Belfast or Dublin to Bristol or Exeter.
    `,

    elsewhereHeading: `I'm coming from anywhere else on Planet Earth`,

    elsewhere: `
      We have a few guests representing team USA, plus others coming from the
      wider world. We reckon you'll be getting a flight to London. Then you can
      just get a train from London Paddington to Tiverton Parkway and taxi the
      rest of the way as per the Londoner advice above.
    `,

    taxisHeading: `Local taxis`,

    taxisIntro: `
      Deer Park is out in the countryside, so you'll want a taxi booked in
      advance rather than hoping one turns up.
    `,

    taxis: [
      { name: `Sparkys Taxis`,    tel: `01404 47670`,   note: `Honiton. The one we use.` },
      { name: `Millstream Taxis`, tel: `01404 45825`,   note: `Honiton` },
      { name: `Hello Taxis`,      tel: `07535 554441`,  note: `Honiton High Street` },
      { name: `Regency Cars`,     tel: `01404 549300`,  note: `Honiton Business Park` },
      { name: `Aquarius Taxis`,   tel: `07882 002028`,  note: `Covers wider East Devon` },
    ],
  },

  /* ============================== FAQ PAGE ============================= */
  // Add new questions anywhere in this list EXCEPT after the last two about
  // the website — those two stay at the bottom as a reward for scrolling.
  faq: {
    title: `FAQ`,
    questions: [
      {
        q: `What's the dress code?`,
        a: `
          The short answer is Summer suits & dresses. For those of you that
          exist on Instagram, "funky formal" is Bechan's vibe of choice and she
          has a Pinterest link ready to go if you are unsure what that means.
          For most of you, Bechan (and occasionally Ethan) has almost certainly
          turned up to one of your events wearing something completely
          ridiculous, but normally pretty cool, so take this as your opportunity
          to return the favour. Btw Bechan doesn't care if you wear white. Not
          a joke.
        `,
      },
      {
        q: `Why Devon?`,
        a: `
          Broadhembury is pretty much Bechan's happy place. Dale & Catherine
          bought the house there around 30 years ago and have been taking the
          Thomas kids there every school holiday they possibly could ever since.
          Ethan couldn't believe real places like that existed in England and
          not just in Noddy or Postman Pat or Enid Blyton books.
          If we haven't already made you visit, we genuinely can't wait for you
          to come and see why we love it so much.
        `,
      },
      {
        q: `Can I buy you a present?`,
        a: `
          Of course the correct thing to do is to say your presence is gift
          enough, blah blah. But we love stuff too much, so yes please to any
          prezzies! We'll post a link to our gift registry here when we finally
          get our act together and make one.
        `,
      },
      {
        q: `What shoes should I wear?`,
        a: `
          Bechan will be wearing the most ridiculous high heels ever conceived
          by mankind (cool), but naturally as it's the Devon countryside, flat
          solid ground is by no means a guarantee. We'd recommend taking a pair
          of flats as a back up for the wobbly bits.
        `,
      },
      {
        q: `Can I park my car?`,
        a: `
          Deer Park has plenty of onsite parking so should be all good for the
          Saturday. For the Friday and Sunday, if you're coming to Broadhembury,
          the main square has a decent amount of parking but you may have to
          leave your car slightly up the road if that fills up.
        `,
      },
      {
        q: `Can I bring my kids?`,
        a: `
          Apologies to be a pain, but we're going adults only for this one. If
          you're able to wrangle grandparents or babysitters, we hope that allows
          you to relinquish all responsibility and maturity and properly let your
          hair down.
        `,
      },

      // ---- Keep these two last ----
      {
        q: `Who made the website?`,
        a: `
          Ethan being a weird computer guy, this was the main thing he could
          actually have a creative input on. So he's taken far too long fiddling
          about on weekends to make this.
        `,
      },
      {
        q: `I'm also a weird basement dweller computer guy, how did you make the website?`,
        a: `
          Built with Next.js (React), Tailwind CSS and Supabase for the database,
          hosted on Vercel. The whole retro desktop look is a half homage half
          rip off of the Windows 95 UI. You can steal my dodgy code if you want
          from the public GitHub repo at [github].
        `,
      },
    ],
  },
} as const
