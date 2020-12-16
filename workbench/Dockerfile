######### BUILD FRONTEND #########
FROM node:10 AS frontend

RUN mkdir -p /app

RUN mkdir -p /app/frontend
WORKDIR /app/frontend
COPY ./frontend .
RUN npm install
RUN npm run build

######### BUILD BACKEND ##########
FROM node:10 AS builder_backend
RUN mkdir -p /app

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

RUN mkdir -p /app/backend
WORKDIR /app/backend
COPY ./backend .
RUN npm install
RUN npm run build

######### MERGE ##################
WORKDIR /app/backend/dist/static
COPY --from=frontend app/frontend/dist/frontend ./frontend


# lgo all copied files 
RUN ls -a -l /app/backend/dist/**

WORKDIR /app/backend
CMD [ "src/scripts/start.sh" ]