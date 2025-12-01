  -- Create clients table
  CREATE TABLE IF NOT EXISTS public.clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(user_id),
      full_name TEXT NOT NULL,
      birth_date DATE,
      city TEXT,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for clients
  ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
  CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
  CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
  CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
  CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

  -- Update vendas table
  ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);
  ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_venda NUMERIC(10, 2) DEFAULT 0;

  -- Migrate existing client names to clients table and link them
  DO $$
  DECLARE
      r RECORD;
      cid UUID;
  BEGIN
      FOR r IN SELECT DISTINCT nome_cliente, user_id FROM public.vendas WHERE client_id IS NULL AND user_id IS NOT NULL LOOP
          -- Check if client already exists for this user
          SELECT id INTO cid FROM public.clients WHERE user_id = r.user_id AND full_name = r.nome_cliente LIMIT 1;
          
          IF cid IS NULL THEN
              INSERT INTO public.clients (user_id, full_name) VALUES (r.user_id, r.nome_cliente) RETURNING id INTO cid;
          END IF;

          UPDATE public.vendas SET client_id = cid WHERE nome_cliente = r.nome_cliente AND user_id = r.user_id;
      END LOOP;
  END $$;

  -- Update profiles table
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_commission_target NUMERIC(10, 2) DEFAULT 5000.00;
  