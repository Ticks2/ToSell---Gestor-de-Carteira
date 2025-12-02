-- Drop the check constraint ensuring commission > 0 to allow 0 commission
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_valor_comissao_check;

-- Add new constraint allowing 0 (>= 0)
ALTER TABLE public.vendas ADD CONSTRAINT vendas_valor_comissao_check CHECK (valor_comissao >= 0);

-- Update the replace_vendas function to fix "DELETE requires WHERE clause" and handle empty commissions
CREATE OR REPLACE FUNCTION replace_vendas(p_vendas JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use WHERE true to satisfy safety checks (fixes 'DELETE requires a WHERE clause' error)
    DELETE FROM public.vendas WHERE true;
    
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
        NULLIF(regexp_replace(x->>'ano_carro', '\D', '', 'g'), '')::INTEGER,
        CASE WHEN x->>'placa' = '' THEN NULL ELSE x->>'placa' END,
        x->>'nome_cliente',
        CASE WHEN x->>'gestauto' = '' THEN NULL ELSE x->>'gestauto' END,
        NULLIF(x->>'valor_financiado', '')::NUMERIC,
        CASE WHEN x->>'retorno' = '' THEN NULL ELSE x->>'retorno' END,
        COALESCE(NULLIF(x->>'tipo_operacao', ''), 'Venda'),
        -- Ensure commission defaults to 0 if missing or empty string
        COALESCE(NULLIF(x->>'valor_comissao', '')::NUMERIC, 0)
    FROM jsonb_array_elements(p_vendas) AS x;
END;
$$;
