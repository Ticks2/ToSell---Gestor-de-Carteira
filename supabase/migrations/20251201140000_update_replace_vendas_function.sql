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
          NULLIF(regexp_replace(x->>'ano_carro', '\D', '', 'g'), '')::INTEGER,
          NULLIF(x->>'placa', ''),
          x->>'nome_cliente',
          CASE WHEN x->>'gestauto' = '' THEN NULL ELSE x->>'gestauto' END,
          NULLIF(x->>'valor_financiado', '')::NUMERIC,
          NULLIF(x->>'retorno', ''),
          COALESCE(NULLIF(x->>'tipo_operacao', ''), 'Venda'),
          NULLIF(x->>'valor_comissao', '')::NUMERIC
      FROM jsonb_array_elements(p_vendas) AS x;
  END;
  $$;
  