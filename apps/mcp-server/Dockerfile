FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# In a real monorepo we might need to worry about workspace deps, but here we treat it isolated for now
# or assume we copy root files. For this "Open-Panel" monorepo, usually we run from root.
# But for simplicity in this generated Dockerfile, I will assume standard build.

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
