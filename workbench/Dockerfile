######### BUILD BACKEND ##########


######### BUILD ADMIN FRONTEND #########
FROM node:10 AS frontend

RUN mkdir -p /app

RUN mkdir -p /app/frontend
WORKDIR /app/frontend
COPY ./frontend .
RUN npm install
RUN npm run build

######### MERGE ##################
FROM node:10 AS builder_backend
RUN mkdir -p /app

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

RUN mkdir -p /app/backend
WORKDIR /app/backend
COPY ./backend .
RUN npm install
RUN npm run build

WORKDIR /app/backend/dist/static
COPY --from=frontend app/frontend/dist/frontend ./frontend
# RUN cp -r ./frontend/dist/frontend ./backend/dist/static


# check if all wass copied correct
RUN ls -a -l /app/backend/dist/**

WORKDIR /app/backend
CMD [ "src/scripts/start.sh" ]