# tracking

Scripts de rastreamento para persistência de parâmetros de campanha (UTMs, Google Ads, Meta) em cookies e propagação através dos links da página.

## Scripts disponíveis

### `utm-cookie-persist.js`

Versão enxuta. Captura parâmetros da URL (`utm_*`, `gclid`, `gad_campaignid`, `fbp`, `fbc`) e:

- Salva em cookies no domínio raiz por 2 anos
- Reinjeta na URL atual via `history.replaceState`
- Propaga em todos os links da página (internos e externos não bloqueados)
- Intercepta cliques em links dinâmicos
- Links internos recebem todos os parâmetros; externos recebem apenas UTMs e `fbp`/`fbc` (gclid/gad_campaignid ficam retidos no domínio)
- Domínios de redes sociais, buscadores e agregadores ficam em blocklist de propagação

### `utm-cookie-persist-referrer-mapping.js`

Mesma lógica do anterior, mais uma camada de fallback: se a URL chega sem UTMs, tenta inferir a origem a partir do `document.referrer` e preenche `utm_source` e `utm_medium` com base em um mapeamento de domínios conhecidos (Google, Instagram, YouTube, ChatGPT, etc.). Útil para capturar tráfego orgânico que chega sem parametrização.

## Uso

### Método recomendado — loader inline

Funciona em qualquer ambiente, incluindo construtores como GreatPages que processam tags `<script src>` externas de forma problemática. Usa a mesma técnica de carregamento que o GTM, Meta Pixel e outros — cria a tag de script dinamicamente em runtime.

**Versão enxuta:**

```html
<script>
(function() {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://cdn.jsdelivr.net/gh/maoliver92/tracking@main/utm-cookie-persist.js';
  document.head.appendChild(s);
})();
</script>
```

**Versão com referrer mapping:**

```html
<script>
(function() {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://cdn.jsdelivr.net/gh/maoliver92/tracking@main/utm-cookie-persist-referrer-mapping.js';
  document.head.appendChild(s);
})();
</script>
```

### Método alternativo — tag externa direta

Funciona em ambientes que não interferem com tags de script externas (sites HTML puros, WordPress, Astro, etc.):

```html
<script src="https://cdn.jsdelivr.net/gh/maoliver92/tracking@main/utm-cookie-persist.js" async></script>
```

## Observações

- O `_fbp` é lido do cookie nativo da Meta Pixel quando não vem na URL
- O `fbc` é montado a partir do `fbclid` da URL se não existir o cookie `_fbc`
- Cookies só são persistidos com `SameSite=None; Secure` (requer HTTPS)
- Cache do jsDelivr em `@main` pode levar até 12h para atualizar — use https://www.jsdelivr.com/tools/purge se precisar forçar atualização
- Em construtores como GreatPages, **sempre prefira o loader inline** — tags `<script src>` externas podem disparar erro `Maximum call stack size exceeded` na função interna `InserirScripts`
