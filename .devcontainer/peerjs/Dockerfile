FROM node:18-alpine

RUN npm -g install peer

ENTRYPOINT ["peerjs", "--port", "80", "--proxied", "true", "--concurrent_limit", "100", "--path", "/"]