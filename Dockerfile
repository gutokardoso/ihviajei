FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN apk add --no-cache postgresql-client
RUN npm install --omit=dev --ignore-scripts
COPY server.js ./
COPY db-postgres-sync.js ./
COPY postgres-sync-worker.js ./
COPY scripts ./scripts
COPY tests.js places-tests.js ./
COPY public ./public
# SQLite fica disponível apenas para desenvolvimento/testes e como origem de migração.
# Em produção o servidor exige DATABASE_URL e opera em PostgreSQL.
RUN mkdir -p /app/data
ENV PORT=3000 DB_PATH=/app/data/ihviajei.db NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
