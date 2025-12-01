CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_venda DATE NOT NULL,
    carro TEXT NOT NULL,
    ano_carro INTEGER NOT NULL CHECK (ano_carro >= 1980),
    placa TEXT CHECK (placa ~ '^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-[0-9]{4}$'),
    nome_cliente TEXT NOT NULL,
    gestauto TEXT CHECK (gestauto IN ('Sim', 'Não')),
    valor_financiado NUMERIC(10, 2) CHECK (valor_financiado >= 0),
    retorno TEXT CHECK (retorno IN ('R1', 'R2', 'R3', 'R4', 'R5')),
    tipo_operacao TEXT NOT NULL DEFAULT 'Venda' CHECK (tipo_operacao IN ('Venda', 'Compra')),
    valor_comissao NUMERIC(10, 2) NOT NULL CHECK (valor_comissao > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for authenticated users" ON public.vendas
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION replace_vendas(p_vendas JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.vendas;
    
    INSERT INTO public.vendas (
        data_venda, 
        carro, 
        ano_carro, 
        placa, 
        nome_cliente, 
        gestauto, 
        valor_financiado, 
        retorno, 
        tipo_operacao, 
        valor_comissao
    )
    SELECT 
        (x->>'data_venda')::DATE,
        x->>'carro',
        (x->>'ano_carro')::INTEGER,
        CASE WHEN x->>'placa' = '' THEN NULL ELSE x->>'placa' END,
        x->>'nome_cliente',
        CASE WHEN x->>'gestauto' = '' THEN NULL ELSE x->>'gestauto' END,
        (x->>'valor_financiado')::NUMERIC,
        CASE WHEN x->>'retorno' = '' THEN NULL ELSE x->>'retorno' END,
        COALESCE(x->>'tipo_operacao', 'Venda'),
        (x->>'valor_comissao')::NUMERIC
    FROM jsonb_array_elements(p_vendas) AS x;
END;
$$;
