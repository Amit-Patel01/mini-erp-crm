FROM node:20-alpine

# Install OpenSSL required by Prisma in Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm run seed && npm start"]
