# ============================================================
# ESTÁGIO 1 — build do Vite
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

# Copia só os manifests primeiro (aproveita cache)
COPY package.json package-lock.json ./

# Instala dependências exatas do lock
RUN npm ci

# Copia o resto do código
COPY . .

# Builda (roda tsc -b && vite build)
RUN npm run build

# ============================================================
# ESTÁGIO 2 — serve os estáticos com Nginx
# ============================================================
FROM nginx:alpine

# Remove o site padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia só o resultado do build (o resto do Node fica no estágio 1)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]