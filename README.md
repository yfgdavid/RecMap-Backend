🗺️ RecMap Backend

RecMap é uma plataforma completa para gestão de resíduos sólidos urbanos (RSU), oferecendo mapa interativo, denúncias colaborativas, dashboard governamental e geração automática de relatórios em PDF.

🚀 Visão Geral

A plataforma integra:

🗺️ Mapa interativo com pontos de coleta e denúncias

📢 Denúncias ambientais com validação comunitária (confirmar/contestar)

📊 Dashboard executivo com KPIs e evolução mensal

📄 Relatórios automatizados em PDF com gráficos

🔐 Autenticação JWT

✉️ Recuperação de senha via e-mail

🏗️ Arquitetura Técnica
Frontend (React) → Express.js (porta 3333) → PostgreSQL (Prisma)
                                ↓
                       Services: Email, Upload, PDF


Stack utilizada:

Backend: Node.js + TypeScript + Express

Banco: PostgreSQL + Prisma ORM

Autenticação: JWT + bcrypt

Uploads: Multer (fotos com timestamp)

Geocodificação: Nominatim (OpenStreetMap)

Email: Nodemailer + Brevo SMTP

✨ Funcionalidades
Módulo	Status	Endpoints Principais

Autenticação	✅ Completo	POST /auth/register, POST /auth/login, POST /auth/forgot-password

Denúncias	✅ Completo	GET/POST /denuncias, GET /denuncias/pendentes/:idusuario

Pontos de Coleta	✅ Completo	GET/POST /pontos (45 cadastrados)

Validações	✅ Completo	POST /validacoes (apenas 1 por usuário/denúncia)

Governamental	✅ Completo	GET /governamental/dashboard, PATCH /governamental/denuncias/:id/status

Mapa	✅ Completo	GET /mapa?tipo=ponto ou ?tipo=denuncia

Relatórios	✅ Completo	GET /relatorios/infografico (PDF automático)

📦 Instalação Rápida
🔧 Backend Node.js

git clone https://github.com/yfgdavid/RecMap-Backend.git

cd RecMap-Backend

npm install

cp .env.example .env

npx prisma migrate dev --name init

npm run dev


➡️ A API rodará em: http://localhost:3333
