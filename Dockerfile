FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install ONLY production dependencies
# Network timeout increased for reliability
RUN npm install --omit=dev --foreground-scripts

# Copy application code
COPY server.js ./
COPY dist ./dist

# Environmental variables
ENV PORT=8000
ENV NODE_ENV=production

EXPOSE 8000

# Use shell form to ensure PORT environment variable is strictly honored as per guide
CMD sh -c "node server.js"
