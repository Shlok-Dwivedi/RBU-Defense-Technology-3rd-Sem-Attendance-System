# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to this port
# Back4app will set the PORT environment variable automatically
EXPOSE 3000

# Command to run your application
CMD [ "node", "server.js" ]
