import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local'); process.exit(1) }
if (!key) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1) }

const supabase = createClient(url, key)

const guests = [
  {
    first_name: 'Ethan',
    last_name: 'Harbinson',
    email: 'eharbinson966@gmail.com',
    password: 'test',
    friday_invited: true,
    has_deer_park_room: true,
    plus_one_allowed: true,
  },
]

const { error } = await supabase.from('guests').insert(guests)

if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`Inserted ${guests.length} guest(s) successfully.`)
