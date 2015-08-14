
# TODO: move server to npm, use small script as bootstrapping in docker

FROM    node

# Bundle app source
ADD . /src

# Install app dependencies
RUN cd /src; npm install --registry http://sjc-npm-cache.ustream.tv:4873

# replace this with your application's default port
EXPOSE 1337

CMD ["node", "/src/bin/jms.js", "--config", "local", "--localContext"]