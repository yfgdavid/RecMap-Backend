# 🔄 Fluxo Git - Puxar Atualizações e Subir Alterações

## 📥 Passo 1: Puxar Atualizações da Main

```bash
# 1. Verificar status atual
git status

# 2. Salvar suas alterações locais (se houver)
git add .
git commit -m "WIP: salvando alterações antes de puxar main"

# 3. Buscar atualizações do repositório remoto
git fetch origin main

# 4. Mesclar as atualizações da main na sua branch
git merge origin/main
```

**Se houver conflitos:**
```bash
# Resolver conflitos manualmente nos arquivos
# Depois:
git add .
git commit -m "merge: resolve conflitos com main"
```

---

## 📤 Passo 2: Subir Suas Alterações

```bash
# 1. Adicionar todas as alterações
git add .

# 2. Ver o que será commitado
git status

# 3. Fazer commit com mensagem descritiva
git commit -m "feat: descrição do que foi feito"

# 4. Enviar para o GitHub
git push origin hugo
```

---

## 🚀 Fluxo Completo (Um Comando de Cada Vez)

```bash
# 1. Verificar status
git status

# 2. Salvar alterações locais (se necessário)
git add .
git commit -m "WIP: alterações locais"

# 3. Puxar atualizações
git fetch origin main
git merge origin/main

# 4. Adicionar suas novas alterações
git add .

# 5. Commit
git commit -m "feat: sua descrição aqui"

# 6. Push
git push origin hugo
```

---

## ⚡ Versão Rápida (Tudo de Uma Vez)

```bash
# Puxar e mesclar
git fetch origin main && git merge origin/main

# Salvar e subir
git add . && git commit -m "feat: descrição" && git push origin hugo
```

---

## 🔍 Comandos Úteis

```bash
# Ver diferenças antes de commitar
git diff

# Ver histórico de commits
git log --oneline -5

# Desfazer alterações não commitadas
git restore .

# Ver branch atual
git branch --show-current
```

---

## ⚠️ Dicas Importantes

1. **Sempre verifique o status** antes de fazer merge
2. **Commit suas alterações** antes de puxar atualizações
3. **Resolva conflitos** antes de fazer push
4. **Use mensagens descritivas** nos commits
5. **Teste o código** após o merge

