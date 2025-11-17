# 📋 Guia Completo de Comandos - RecMap Backend

## 🚀 Comandos Essenciais

### 1. Instalar Dependências
```bash
npm install
```
**Quando usar:** Primeira vez que clonar o projeto ou quando adicionar novas dependências.

---

### 2. Configurar Banco de Dados

#### Gerar Prisma Client
```bash
npx prisma generate
```
**Quando usar:** 
- Primeira vez que configurar o projeto
- Após alterar o schema do Prisma (`prisma/schema.prisma`)
- Após fazer pull de mudanças no schema

#### Verificar Status do Banco
```bash
npx prisma migrate status
```
**Quando usar:** Para verificar se o banco está sincronizado com o schema.

#### Criar/Atualizar Tabelas no Banco
```bash
npx prisma migrate dev --name nome_da_migration
```
**Quando usar:** Quando você alterar o `schema.prisma` e precisar atualizar o banco.

#### Aplicar Migrations (Produção)
```bash
npx prisma migrate deploy
```
**Quando usar:** Em produção ou quando houver migrations pendentes.

---

### 3. Rodar o Projeto

#### Modo Desenvolvimento (Recomendado)
```bash
npm run dev
```
**O que faz:**
- Inicia o servidor na porta 3333 (ou a porta do `.env`)
- Recarrega automaticamente quando você salva arquivos
- Mostra erros no console em tempo real

#### Compilar TypeScript (Produção)
```bash
npm run build
```
**O que faz:** Compila o código TypeScript para JavaScript na pasta `dist/`

#### Rodar em Produção
```bash
npm start
```
**O que faz:** Roda o código compilado (precisa rodar `npm run build` antes)

---

### 4. Banco de Dados - Visualização e Gerenciamento

#### Abrir Prisma Studio (Interface Visual)
```bash
npx prisma studio
```
**O que faz:** Abre uma interface web em `http://localhost:5555` para visualizar e editar dados do banco.

#### Ver Estrutura do Banco
```bash
npx prisma db pull
```
**O que faz:** Puxa a estrutura atual do banco e atualiza o schema.

#### Resetar Banco (CUIDADO!)
```bash
npx prisma migrate reset
```
**⚠️ ATENÇÃO:** Apaga todos os dados e recria o banco do zero!

---

## 📦 Comandos Adicionais Úteis

### Verificar Variáveis de Ambiente
```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

### Verificar Porta em Uso
```bash
# Windows
netstat -ano | findstr :3333

# Linux/Mac
lsof -i :3333
```

### Limpar Cache e Reinstalar
```bash
# Limpar node_modules
rm -rf node_modules  # Linux/Mac
Remove-Item -Recurse -Force node_modules  # Windows PowerShell

# Reinstalar
npm install
```

---

## 🔄 Fluxo Completo de Setup (Primeira Vez)

```bash
# 1. Instalar dependências
npm install

# 2. Verificar/criar arquivo .env com DATABASE_URL
# (já deve existir, mas verifique)

# 3. Gerar Prisma Client
npx prisma generate

# 4. Verificar status do banco
npx prisma migrate status

# 5. Se necessário, criar migrations
npx prisma migrate dev --name init

# 6. Rodar o projeto
npm run dev
```

---

## 🎯 Comandos por Situação

### Primeira vez no projeto:
```bash
npm install
npx prisma generate
npm run dev
```

### Após fazer pull de mudanças:
```bash
npm install  # Se houver novas dependências
npx prisma generate  # Se o schema mudou
npm run dev
```

### Após alterar o schema do banco:
```bash
npx prisma migrate dev --name nome_da_alteracao
npx prisma generate
npm run dev
```

### Para visualizar dados do banco:
```bash
npx prisma studio
```

### Para fazer deploy:
```bash
npm run build
npm start
```

---

## 🔄 Git - Sincronizando com o Repositório Remoto

### Fluxo Recomendado (com Feature Branch e Pull Request)

1.  **Crie e mude para uma nova branch:**
    ```bash
    git checkout -b nome-da-sua-branch 
    # Ex: git checkout -b feature/tela-de-login
    ```

2.  **Faça suas alterações e adicione ao "stage":**
    ```bash
    git add .
    ```

3.  **Crie um commit com uma mensagem descritiva:**
    ```bash
    git commit -m "feat: adiciona validação de formulário"
    ```

4.  **Envie sua branch para o repositório remoto:**
    ```bash
    git push origin nome-da-sua-branch
    ```

5.  **Abra um Pull Request (PR)** no GitHub/GitLab para mesclar suas alterações na `main`.

### Fluxo Rápido (Direto na `main` - Cuidado!)

**⚠️ Use apenas se estiver trabalhando sozinho no projeto.**

```bash
# 1. Adiciona todas as alterações
git add .

# 2. Cria o commit
git commit -m "fix: corrige bug no cálculo"

# 3. Puxa atualizações remotas para evitar conflitos
git pull origin main

# 4. Envia suas alterações para a main
git push origin main
```

---

##  Variáveis de Ambiente Necessárias

Certifique-se de que o arquivo `.env` contém:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="seu_secret_aqui"
SMTP_HOST="smtp..."
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
FROM_NAME="RecMap"
FROM_EMAIL="..."
BACKEND_URL="http://localhost:3333"
PORT=3333
```

---

## ✅ Checklist Rápido

Antes de rodar o projeto, verifique:

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Banco de dados acessível (verificar `DATABASE_URL`)
- [ ] Porta 3333 disponível (ou alterar no `.env`)

---

## 🆘 Comandos de Troubleshooting

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "Database schema is out of sync"
```bash
npx prisma migrate dev
```

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port already in use"
```bash
# Altere a porta no .env ou mate o processo
```

### Limpar tudo e começar do zero:
```bash
rm -rf node_modules dist
npm install
npx prisma generate
npm run dev
```

---

## 📚 Resumo dos Scripts do package.json

- `npm run dev` - Desenvolvimento (hot reload)
- `npm run build` - Compilar para produção
- `npm start` - Rodar versão compilada

---

**🎉 Pronto! Agora você tem todos os comandos necessários!**
