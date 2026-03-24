import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iodkhkpvacbgrotwaayl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGtoa3B2YWNiZ3JvdHdhYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjQxMjcsImV4cCI6MjA4ODQwMDEyN30.jHsi-DIUyx1-_nmRfFbo5tD8cyTP5NrvILlnhaI-_4I'

export const supabase = createClient(supabaseUrl, supabaseKey)