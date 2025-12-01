  -- Add status column to clients table
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'client';

  -- Create client_interactions table
  CREATE TABLE IF NOT EXISTS public.client_interactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(user_id),
      interaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      interaction_type TEXT NOT NULL,
      notes TEXT,
      next_contact_date DATE,
      status TEXT NOT NULL DEFAULT 'New Lead',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Create client_alerts table
  CREATE TABLE IF NOT EXISTS public.client_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(user_id),
      alert_type TEXT NOT NULL,
      alert_date DATE NOT NULL,
      message TEXT,
      is_dismissed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for new tables
  ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;

  -- Policies for client_interactions
  CREATE POLICY "Users can view their own interactions" ON public.client_interactions
      FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own interactions" ON public.client_interactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
  CREATE POLICY "Users can update their own interactions" ON public.client_interactions
      FOR UPDATE USING (auth.uid() = user_id);
      
  CREATE POLICY "Users can delete their own interactions" ON public.client_interactions
      FOR DELETE USING (auth.uid() = user_id);

  -- Policies for client_alerts
  CREATE POLICY "Users can view their own alerts" ON public.client_alerts
      FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own alerts" ON public.client_alerts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
  CREATE POLICY "Users can update their own alerts" ON public.client_alerts
      FOR UPDATE USING (auth.uid() = user_id);
      
  CREATE POLICY "Users can delete their own alerts" ON public.client_alerts
      FOR DELETE USING (auth.uid() = user_id);
  