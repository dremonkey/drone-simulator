FROM node

MAINTAINER Andre Deutmeyer, andre@skycatch.com

WORKDIR /home/drone-simulator

# Install packages
ADD package.json /home/drone-simulator/package.json
RUN npm install -g nodemon && \
    npm install

# Make everything available for start
ADD . /home/drone-simulator

# currently only works for development
ENV NODE_ENV development