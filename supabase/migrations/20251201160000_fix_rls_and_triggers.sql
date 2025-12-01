-- Enable RLS on vendas table
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Drop any existing insecure policies
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON public.vendas;

-- Create strict policies for vendas
CREATE POLICY "Users can view their own sales" ON public.vendas
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON public.vendas
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON public.vendas
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON public.vendas
    FOR DELETE
    USING (auth.uid() = user_id);

-- Setup Profiles Table RLS and Triggers
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'individual')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
