# tracking

Scripts de rastreamento para persistência de parâmetros de campanha (UTMs, Google Ads, Meta) em cookies e propagação através dos links da página.

## Scripts disponíveis

### `utm_cookie_persist.js`

Versão enxuta. Captura parâmetros da URL (`utm_*`, `gclid`, `gad_campaignid`, `fbp`, `fbc`) e:

- Salva em cookies no domínio raiz por 2 anos
- Reinjeta na URL atual via `history.replaceState`
- Propaga em todos os links da página (internos e externos não bloqueados)
- Intercepta cliques em links dinâmicos via `MutationObserver`
- Links internos recebem todos os parâmetros; externos recebem apenas UTMs e `fbp`/`fbc` (gclid/gad_campaignid ficam retidos no domínio)
- Domínios de redes sociais, buscadores e agregadores ficam em blocklist de propagação

**Uso:**

```html
<script src="https://cdn.jsdelivr.net/gh/maoliver92/tracking@main/utm-cookie-persist.js" async></script>
```

### `utm-cookie-persist-referrer-mapping.js`

Mesma lógica do anterior, mais uma camada de fallback: se a URL chega sem UTMs, tenta inferir a origem a partir do `document.referrer` e preenche `utm_source` e `utm_medium` com base em um mapeamento de domínios conhecidos (Google, Instagram, YouTube, ChatGPT, etc.). Útil para capturar tráfego orgânico que chega sem parametrização.

**Uso:**

```html
<script src="https://cdn.jsdelivr.net/gh/maoliver92/tracking@main/utm-cookie-persist-referrer-mapping.js" async></script>
```

## Observações

- O `_fbp` é lido do cookie nativo da Meta Pixel quando não vem na URL
- O `fbc` é montado a partir do `fbclid` da URL se não existir o cookie `_fbc`
- Cookies só são persistidos com `SameSite=None; Secure` (requer HTTPS)
- Cache do jsDelivr em `@main` pode levar até 12h para atualizar — use https://www.jsdelivr.com/tools/purge se precisar forçar atualização
