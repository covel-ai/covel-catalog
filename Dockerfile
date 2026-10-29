FROM node:26-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/catalog-kit/package.json ./packages/catalog-kit/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY packages/catalog-kit ./packages/catalog-kit
COPY service ./service
RUN mkdir /data && chown node:node /data
USER node
ENV HOST=0.0.0.0 PORT=8787 CATALOG_DATA_DIR=/data
EXPOSE 8787
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "service/main.mjs"]
