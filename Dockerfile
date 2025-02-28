# Use a minimal base image
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install dependencies and Node.js 18
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

# Copy package.json first (important for caching)
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]

