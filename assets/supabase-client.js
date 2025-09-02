(function(){
  const cfg = window.SHERAGES_CONFIG || {};
  const enabled = !!(window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;
  if (enabled) {
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Supabase client init failed:', e);
    }
  }

  async function getUser() {
    if (!enabled || !client) return null;
    try {
      const { data } = await client.auth.getUser();
      return data?.user || null;
    } catch (_) { return null; }
  }

  const api = {
    enabled, client,
    auth: {
      async signUp({ name, email, password, location }) {
        if (!enabled) throw new Error('Supabase not configured');
        return client.auth.signUp({
          email,
          password,
          options: { data: { name, location } }
        });
      },
      async signIn({ email, password }) {
        if (!enabled) throw new Error('Supabase not configured');
        return client.auth.signInWithPassword({ email, password });
      },
      async signOut() {
        if (!enabled) return;
        return client.auth.signOut();
      },
      onAuthStateChange(cb) {
        if (!enabled) return { data: { subscription: { unsubscribe(){} } } };
        return client.auth.onAuthStateChange(cb);
      },
      getUser
    },
    posts: {
      async list() {
        if (!enabled) throw new Error('Supabase not configured');
        return client.from('posts').select('*').order('ts', { ascending: false });
      },
      async create({ text, topic, location }) {
        if (!enabled) throw new Error('Supabase not configured');
        const { data: { user } } = await client.auth.getUser();
        const payload = {
          text, topic, location,
          ts: new Date().toISOString(),
          user_id: user ? user.id : null
        };
        return client.from('posts').insert(payload).select().single();
      }
    },
    symptoms: {
      async list() {
        if (!enabled) throw new Error('Supabase not configured');
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { data: [], error: null };
        return client.from('symptoms')
          .select('*')
          .eq('user_id', user.id)
          .order('date_ts', { ascending: false });
      },
      async create(entry) {
        if (!enabled) throw new Error('Supabase not configured');
        const { data: { user } } = await client.auth.getUser();
        const payload = { ...entry, user_id: user ? user.id : null };
        return client.from('symptoms').insert(payload).select().single();
      }
    }
  };

  window.sheragesSupabase = api;
})();

