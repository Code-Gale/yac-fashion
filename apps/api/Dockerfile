FROM node:20-alpine

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 4000

CMD ["node", "src/server.js"]
