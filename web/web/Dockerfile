# Use an official Nginx image as the base image
FROM nginx:alpine

# Set an argument for the environment variable
ARG ENV

# Set the environment variable from the argument
ENV ENV=${ENV}

# Echo the environment variable during the build process
RUN echo "Environment variable ENV is set to: ${ENV}"

# Copy the custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static files to the Nginx server directory
COPY . /usr/share/nginx/html

# Copy the environment-specific configuration file
COPY env/${ENV}.js /usr/share/nginx/html/common/js/variable.js

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]