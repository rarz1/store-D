#!/usr/bin/env bash
set -e

# Project root assumed to be the current directory
PROJECT_ROOT=C:\Users\User\OneDrive\Documentos\PROYECTOS\STORE

# ---------- Client (React + Vite) ----------
if [ ! -d " /client\ ]; then
 echo \Creating client app...\
 npx -y create-vite@latest client --template react-ts -- --force
 cd client
 npm install
 # Install Capacitor and needed plugins
 npm install @capacitor/core @capacitor/cli
 npx cap init catalog-client com.example.catalogclient \Catalog Client\
 npx cap add android
 cd ..
fi

# ---------- Admin (React + Vite) ----------
if [ ! -d \/admin\ ]; then
 echo \Creating admin app...\
 npx -y create-vite@latest admin --template react-ts -- --force
 cd admin
 npm install
 cd ..
fi

# ---------- Backend (NestJS) ----------
if [ ! -d \/backend\ ]; then
 echo \Creating backend...\
 npx -y @nestjs/cli new backend --language ts --skip-git
 cd backend
 npm install @nestjs/config @nestjs/typeorm typeorm pg @nestjs/swagger swagger-ui-express class-validator class-transformer
 # Basic .env for local dev
 cat > .env <<EOF
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=catalog
JWT_SECRET=supersecretkey
EOF
 cd ..
fi

# ---------- Docker Compose ----------
cat > docker-compose.yml <<'EOF'
version: \3.8\
services:
 postgres:
 image: postgres:15-alpine
 environment:
 POSTGRES_USER: postgres
 POSTGRES_PASSWORD: postgres
 POSTGRES_DB: catalog
 ports:
 - \5432:5432\
 volumes:
 - pgdata:/var/lib/postgresql/data
 backend:
 build: ./backend
 env_file: ./backend/.env
 ports:
 - \3000:3000\
 depends_on:
 - postgres
 client:
 build: ./client
 ports:
 - \5173:5173\
 depends_on:
 - backend
 admin:
 build: ./admin
 ports:
 - \5174:5174\
 depends_on:
 - backend
volumes:
 pgdata:
EOF

# ---------- Build APK script ----------
mkdir -p scripts
cat > scripts/build-apk.sh <<'EOS'
#!/usr/bin/env bash
set -e
cd client
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
EOS
chmod +x scripts/build-apk.sh

echo \Setup complete. Run docker-compose up --build to start services.\
