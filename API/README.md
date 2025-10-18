# Aprender-em-Movimento

Sistema educacional com quiz interativo para alunos e professores, integrando capoeira e tecnologia. Backend em Node.js (Express, Firebase) e frontend em React (Vite).

## Estrutura
- **API/**: Backend Node.js com padrão MVC.
  - `controllers/`: Lógica de negócios (autenticação, comentários, questões, etc.).
  - `models/`: Schemas Firestore (usuários, questões, comentários, etc.).
  - `routes/`: Rotas da API RESTful.
  - `utils/`: Firebase e logging.
- **Frontend**: (A ser adicionado) React com Vite, contendo Student.tsx, Professor.tsx, etc.

## Como Executar
1. Clone o repositório: `git clone https://github.com/ZePequeno25/Aprender-Em-Movimento-JS.git`
2. Instale dependências: `npm install`
3. Configure .env com credenciais Firebase.
4. Inicie o servidor: `npm start`