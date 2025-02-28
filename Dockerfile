# Use Ubuntu as base
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install dependencies and Node.js 18
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get install -y chromium-browser \
    && apt-get install -y ca-certificates fonts-liberation libasound2 libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libxrandr2 libxss1 libxtst6 xdg-utils \
    && apt-get clean

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

