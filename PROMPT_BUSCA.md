# Prompt para buscar empresas com o Claude

Copie tudo dentro do bloco abaixo, troque os campos entre [COLCHETES] e mande para o Claude com a **busca na web ativada**.
Salve a resposta em `listas/<nome-da-lista>.json`.

```
Preciso de uma lista de empresas para prospecção comercial B2B.

- Segmento: [EX: clínicas odontológicas]
- Região: [EX: Curitiba - PR, bairros Batel, Água Verde e Centro]
- Quantidade: [EX: 30] empresas
- Critérios extras: [EX: pequenas e médias, sem grandes redes/franquias]

Regras:
1. Pesquise na web (Google Maps, site oficial, Instagram, páginas de contato) e use SOMENTE dados que você encontrou publicados. Não invente nem deduza telefones.
2. Prefira o número de WhatsApp comercial ou celular da empresa. Se só houver telefone fixo, use o fixo.
3. Telefone só com dígitos, com DDD e sem +55. Ex: 41999998888
4. Só inclua empresas que pareçam ativas hoje. Não repita empresas.
5. Se não achar a quantidade pedida com dados confiáveis, devolva menos. Não complete a lista.

Responda APENAS com um array JSON válido, sem texto antes ou depois, neste formato:

[
  {
    "nome": "Nome da Empresa",
    "telefone": "41999998888",
    "cidade": "Curitiba",
    "segmento": "clínica odontológica",
    "fonte": "URL de onde tirou o telefone"
  }
]
```

## Dicas
- Qualquer campo do JSON pode ir no molde: `{{nome}}`, `{{cidade}}`, `{{segmento}}`...
- Confira por amostragem alguns números usando o campo `fonte`. Os números sem WhatsApp o bot já descarta sozinho.
- Para listas grandes, peça por bairro ou subsegmento (lotes de 20 a 30) e salve cada uma em um arquivo.
