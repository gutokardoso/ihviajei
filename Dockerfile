FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY public ./public
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV PORT=3000 DB_PATH=/app/data/ihviajei.db
EXPOSE 3000
CMD ["node", "server.js"]
