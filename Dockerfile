FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY server.js ./
COPY db-postgres-sync.js ./
COPY postgres-sync-worker.js ./
COPY scripts ./scripts
COPY public ./public
# O volume do Railway é montado em runtime. O processo permanece como root
# para conseguir inicializar/gravar SQLite em volumes novos independentemente
# do UID/GID atribuído pelo provedor.
RUN mkdir -p /app/data
ENV PORT=3000 DB_PATH=/app/data/ihviajei.db
EXPOSE 3000
CMD ["node", "server.js"]
