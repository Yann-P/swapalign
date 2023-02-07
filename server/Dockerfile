FROM node:15.9-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app
RUN npm install
COPY . /app

CMD ["npx", "ts-node", "src/index.ts"]
EXPOSE 4000