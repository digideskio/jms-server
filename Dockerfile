FROM node:0.12-onbuild
# replace this with your application's default port
EXPOSE 8888

FROM redis
CMD [ "redis-server", " --appendonly yes" ]