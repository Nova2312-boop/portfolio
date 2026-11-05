# Portfolio : build du front React puis serveur Express qui sert le site + l'API sur un seul port.
FROM node:22-alpine AS build
WORKDIR /app
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --prefix server --omit=dev && npm ci --prefix client
COPY . .
RUN npm run build --prefix client

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    DATA_DIR=/data \
    UPLOADS_DIR=/uploads
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist
# /data (contenu, messages, sauvegardes) et /uploads (images) doivent être des volumes persistants
VOLUME ["/data", "/uploads"]
EXPOSE 5000
CMD ["node", "server/index.js"]
