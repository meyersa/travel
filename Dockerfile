# Use Node.js LTS version as base image
FROM node:23-alpine

# SIGKILL Fix
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /src

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . /src

# Expose the port on which your application runs
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]