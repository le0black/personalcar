# Configuração do Supabase — Abastece

Passo a passo para ligar o banco de dados com login por usuário. Leva ~10 min.

## 1. Criar o projeto

1. Acesse <https://supabase.com> e faça login (pode usar conta Google/GitHub).
2. **New project** → escolha uma organização.
3. Preencha:
   - **Name**: `abastece` (ou o que preferir)
   - **Database Password**: gere uma senha forte e **guarde** (você não precisa dela no app, mas o Supabase pede).
   - **Region**: escolha a mais próxima (ex.: `South America (São Paulo)`).
4. **Create new project** e aguarde ~2 min até provisionar.

## 2. Criar as tabelas

1. No projeto, menu lateral → **SQL Editor** → **New query**.
2. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql) deste repositório, copie todo o conteúdo, cole no editor.
3. Clique em **Run**. Deve aparecer *Success. No rows returned*.
   - Isso cria as tabelas `vehicles` e `refuels` e ativa o **RLS** (cada usuário só vê os próprios dados).

## 3. Pegar as chaves da API

1. Menu lateral → **Project Settings** (engrenagem) → **API**.
2. Copie:
   - **Project URL** → vira `VITE_SUPABASE_URL`
   - **Project API keys → anon / public** → vira `VITE_SUPABASE_ANON_KEY`
   - A `anon key` é pública por design; a segurança vem do RLS. **Nunca** use a `service_role` no front-end.

## 4. Configurar o ambiente local

1. Copie o exemplo:
   ```bash
   cp .env.example .env.local
   ```
2. Edite `.env.local` com as chaves do passo 3.
3. Rode o app:
   ```bash
   npm run dev
   ```
4. Abra <http://localhost:8080>. Deve aparecer a **tela de login**.

## 5. Autenticação (e-mail/senha)

Por padrão o Supabase já habilita login por e-mail/senha.

- **Confirmação de e-mail**: em **Authentication → Providers → Email**, o *Confirm email* costuma vir **ligado**. Com ele ligado, ao criar conta o usuário recebe um link e só entra depois de confirmar.
- Para testar rápido sem e-mail, você pode **desligar** *Confirm email* temporariamente (a conta entra na hora). Reative antes de ir para produção.
- **URLs de redirecionamento**: em **Authentication → URL Configuration**, adicione a URL do seu site na Vercel (ex.: `https://seu-app.vercel.app`) em *Site URL* e *Redirect URLs*.

## 6. Deploy na Vercel

1. Suba o repositório para o GitHub e importe na Vercel (**New Project**).
2. Em **Settings → Environment Variables**, adicione as **mesmas** duas variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Build & Output** (Settings → General):
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run build`
   - **Output Directory**: deixe em branco. O build já gera o formato oficial
     **Vercel Build Output API** em `.vercel/output/` (definido por
     `nitro: { preset: "vercel" }` em `vite.config.ts`), e a Vercel o detecta
     automaticamente.
4. Faça o deploy. Pronto — cada pessoa cria a própria conta e vê só os próprios veículos.

## Notas

- Os arquivos `.env` / `.env.local` estão no `.gitignore` e **não** vão para o Git.
- Se aparecer a tela *"Supabase não configurado"*, é porque as variáveis não estão preenchidas (localmente no `.env.local`, ou nas env vars da Vercel).
- O banco de modelos de veículos (marcas/modelos 1970→hoje) fica em [`src/lib/vehicle-database.ts`](src/lib/vehicle-database.ts) e é estático — não depende do Supabase.
