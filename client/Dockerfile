FROM node:15.9-alpine AS builder

# set working directory
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app
RUN npm install
COPY . /app

RUN npx parcel build *.html

FROM nginx:1.16.0-alpine
COPY --from=builder /app/dist/* /usr/share/nginx/html/
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80