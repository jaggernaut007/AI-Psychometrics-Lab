async function searchDarkTriad() {
  const [{ createClient }, dotenv] = await Promise.all([
    import('@supabase/supabase-js'),
    import('dotenv')
  ]);
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: runs, error } = await supabase
    .from('runs')
    .select('model_name, results')
    .limit(100);

  if (error || !runs) {
    console.error('Error:', error);
    return;
  }

  const modelsWithDT = runs.filter((run) => run.results?.darktriad);
  console.log(`Found ${modelsWithDT.length} runs with darktriad.`);
  modelsWithDT.forEach((run) => {
    console.log(`Model: ${run.model_name}`);
    console.log('  - results keys:', Object.keys(run.results ?? {}));
    console.log('  - darktriad traitScores:', run.results?.darktriad?.traitScores);
  });
}

searchDarkTriad().catch((error) => {
  console.error('Unexpected failure:', error);
});
