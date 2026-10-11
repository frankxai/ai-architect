FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY server.mjs ./
COPY src ./src
COPY public ./public
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
