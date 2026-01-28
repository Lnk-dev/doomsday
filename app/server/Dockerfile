FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
