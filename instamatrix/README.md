# InstaMatrix v5 — Backend Netlify

Sistema de publicação multi-conta no Instagram via Meta Graph API, com backend seguro em Netlify Functions.

---

## Estrutura do projeto

```
instamatrix/
├── netlify/
│   └── functions/
│       ├── oauth-token.js    ← Troca code OAuth por token (protege o App Secret)
│       ├── ig-proxy.js       ← Proxy para a Graph API (evita CORS)
│       └── check-token.js    ← Verifica validade do token
├── public/
│   └── index.html            ← Frontend (InstaMatrix v5)
├── .env.example              ← Modelo de variáveis de ambiente
├── .gitignore
├── netlify.toml              ← Configuração da Netlify
└── package.json
```

---

## Deploy passo a passo

### 1. Suba o projeto no GitHub

```bash
git init
git add .
git commit -m "InstaMatrix v5 com backend Netlify"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/instamatrix.git
git push -u origin main
```

### 2. Conecte na Netlify

1. Acesse [app.netlify.com](https://app.netlify.com) e clique em **"Add new site" → "Import an existing project"**
2. Escolha **GitHub** e selecione o repositório `instamatrix`
3. Configurações de build:
   - **Build command:** deixe em branco (ou `echo ok`)
   - **Publish directory:** `public`
4. Clique em **Deploy site**

### 3. Configure a variável de ambiente

1. No painel da Netlify: **Site configuration → Environment variables**
2. Clique em **"Add a variable"**
3. Adicione:
   - **Key:** `META_APP_SECRET`
   - **Value:** o App Secret do seu app no [Meta for Developers](https://developers.facebook.com/)
4. Clique em **Save** e depois em **"Trigger deploy"** para redesployar com a variável

### 4. Configure o App no Meta

No [Meta for Developers](https://developers.facebook.com/):

1. Vá em **Configurações básicas → Plataformas**
2. Adicione a plataforma **Web** com a URL do seu site Netlify (ex: `https://instamatrix-xyz.netlify.app`)
3. Em **Produtos → Facebook Login → Configurações**:
   - Adicione a URL do site em **Valid OAuth Redirect URIs**:
     `https://SEU-SITE.netlify.app`
4. Certifique-se de que o app tem as permissões:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`

---

## Desenvolvimento local

```bash
# Instale as dependências
npm install

# Instale a Netlify CLI globalmente
npm install -g netlify-cli

# Crie o arquivo .env com seu App Secret
cp .env.example .env
# Edite .env e coloque seu META_APP_SECRET

# Rode localmente (simula as Netlify Functions)
netlify dev
```

O site ficará disponível em `http://localhost:8888`

---

## Como funciona o backend

| Rota | Função | O que faz |
|------|--------|-----------|
| `POST /api/oauth-token` | `oauth-token.js` | Troca o code OAuth pelo Access Token usando o App Secret (que fica seguro no servidor) |
| `POST /api/ig-proxy` | `ig-proxy.js` | Proxy para qualquer chamada à Graph API (evita bloqueio de CORS) |
| `POST /api/check-token` | `check-token.js` | Verifica se um token é válido e retorna info da conta |

---

## Por que esse backend resolve o problema original?

O erro `Invalid platform app` acontecia porque:

1. **O App Secret estava exposto no frontend** — o Facebook bloqueia trocas de token feitas diretamente do browser quando o secret está visível
2. **CORS** — chamadas diretas à Graph API do browser são bloqueadas em certos contextos

Com o backend:
- O `META_APP_SECRET` só existe no servidor (variável de ambiente da Netlify)
- Todas as chamadas à Graph API passam pelo proxy, eliminando o CORS
- O token gerado é automaticamente convertido para **long-lived token (60 dias)**
