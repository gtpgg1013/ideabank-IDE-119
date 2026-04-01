FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

ENV PORT=3201
ENV ACCESS_PASSWORD=ideabank2026

EXPOSE 3201

CMD ["npm", "start"]
