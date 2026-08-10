# ============================================
# DOCKERFILE - FRONTEND ANGULAR 18 (PRODUCTION)
# ============================================

# Stage 1: Build Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Build de production - base-href /esacom-pro/ pour cohabiter avec
# d'autres projets sur le meme port (chacun sous son propre prefixe de
# chemin, voir nginx.conf)
RUN npm run build -- --configuration=production --base-href=/esacom-pro/

# Stage 2: Nginx
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
# IMPORTANT: Le chemin doit correspondre à outputPath dans angular.json
COPY --from=build /app/dist/easycom-app/browser /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]