# Use Node.js 16 as the base image
FROM node:18-alpine as builder

# Create the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Install TypeScript
RUN npm install -g typescript

# Copy the tsconfig.json file
COPY tsconfig.json .
# Copy the rest of the application code
COPY . .

# Set the environment variable
ENV NODE_ENV=production

# Expose the port that your application listens on
EXPOSE 8000

# build the app
RUN npm run build
# Start the application
CMD [ "node", "dist/index.js" ]
