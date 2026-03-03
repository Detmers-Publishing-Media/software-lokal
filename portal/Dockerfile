FROM node:22-slim
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src/ src/
COPY public/ public/
EXPOSE 3200
CMD ["node", "src/server.js"]
