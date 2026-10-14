import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wburchzshbkgdpfwvfzy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXJjaHpzaGJrZ2RwZnd2Znp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4OTcyNjksImV4cCI6MjA3NTQ3MzI2OX0.q5NDSNsBQF3CU-JrezA3YIr1SYVgZckb4gzaEvHxSME'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
