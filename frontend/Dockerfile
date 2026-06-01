# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve using high-performance Nginx
FROM nginx:alpine

# Copy built files from build stage to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration if needed (we can write one or use default)
# Default is perfectly fine for basic single page apps. Let's make sure it handles history routing if needed.
# Since we have custom routes on frontend handled inside App.jsx state, standard Nginx works flawlessly!

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
