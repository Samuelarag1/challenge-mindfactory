FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && \
    mkdir -p /tmp/frontend-dist && \
    if [ -d dist/frontend/browser ]; then cp -r dist/frontend/browser/. /tmp/frontend-dist/; \
    elif [ -d dist/frontend ]; then cp -r dist/frontend/. /tmp/frontend-dist/; \
    else echo "No se encontro el directorio de build del frontend" && exit 1; fi

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /tmp/frontend-dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
