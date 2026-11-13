# Stage 1: install dependencies and build both applications
FROM node:20-alpine AS build
WORKDIR /app
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN cd server && npm install
RUN cd client && npm install
COPY server ./server
COPY client ./client
RUN cd server && npx prisma generate
RUN cd client && npm run build
RUN cd server && npm run build

# Stage 2: production runtime with production dependencies only
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=build /app/server/node_modules/@prisma ./server/node_modules/@prisma
COPY --from=build /app/client/dist ./client/dist
ENV PORT=3001
EXPOSE 3001
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]