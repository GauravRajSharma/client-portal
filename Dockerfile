# Use an official Node.js runtime as a parent image
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Install expo-cli globally
RUN npm install -g expo-cli

# Copy package.json and package-lock.json (or yarn.lock) first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Build the web version of the Expo app
RUN npx expo export -p web

# Expose the port that expo serve uses (default 19006)
EXPOSE 19006

# Start the Expo web server
CMD ["npx", "expo", "serve", "--port", "19006"]