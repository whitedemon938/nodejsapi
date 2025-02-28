# Use Ubuntu as base
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install dependencies and Node.js 18
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get install -y chromium-browser \
    && apt-get clean

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json first (important for caching)
COPY package.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
