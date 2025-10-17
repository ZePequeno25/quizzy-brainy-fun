primeiro precisa copiar meu git: https://github.com/ZePequeno25/Aprender-Em-Movimento-JS.git depois
de uma conta no render: https://dashboard.render.com depois
pressione add new -> web service voce loga com a conta do git e escolhe o projeto que foi copiado ou cole o link publico do repositório e clica em confirmar depois voce so vai precisar mudar Build Command para npm i e escolha o plano free logo abaixo tem as variáveis de ambiente onde vai ser necessário essas


PORT=

FIREBASE_SERVICE_ACCOUNT=

ALLOWED_ORIGINS=http://127.0.0.1:5000,https://77c82926-cc52-4e97-9f3b-585910fae583.lovableproject.com,https://9000-firebase-saber-em-movimento-1751421470956.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev,https://nifty-pursuit-382200.web.app,https://nifty-pursuit-382200.firebaseapp.com,https://aprender-em-movimento.onrender.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:1000,http://190.115.208.54:5050,https://id-preview--77c82926-cc52-4e97-9f3b-585910fae583.lovable.app

depois git clone desse repositório: https://github.com/ZePequeno25/quizzy-brainy-fun.git no computador seu abra cmd ou terminal npm i e npm install firebase firebase logout se ouver uma conta diferente logada e firebase login para logar com a conta que adicionei ao meu projeto depois so confirma e pronto depois acesse a pasta src/lib/api.ts e muda o API_URL para o link do render que fizemos antes normalmente encontrado nos events depois execute o comando npm run build  para construir o projeto e juntar na dist depois execute firebase init depois digite y , aqui voce vai descer com a seta ate achar Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys e click espaço e enter digite dist enter, y enter, n enter
depois digite firebase emulators:start

## Build do Projeto

Para manter o build sempre atualizado na pasta `dist`:

```bash
# Gerar build de produção
npm run build

# O build será criado automaticamente na pasta dist/
```

**Importante**: Sempre execute `npm run build` antes de fazer deploy para garantir que os arquivos estejam atualizados.

