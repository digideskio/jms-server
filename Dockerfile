# boot2docker init
# vboxmanage modifyvm boot2docker-vm --natpf1 "http,tcp,127.0.0.1,8200,,8200"
# boot2docker --vbox-share="/www/ustream.tv/git=ustream" up
# boot2docker ssh 'sudo mkdir -p /www/ustream.tv/git && sudo mount -t vboxsf ustream /www/ustream.tv/git'
# $(/usr/local/bin/boot2docker shellinit)
# docker build -t necccc/jms-server .
# docker run -d --name jms -p 46160:1337 -v /www/ustream.tv/git:/www/ustream.tv/git necccc/jms-server
# docker exec jms ls -l /www/ustream.tv/git



FROM    node

# Bundle app source
ADD . /src

# Install app dependencies
RUN cd /src; npm install --registry http://sjc-npm-cache.ustream.tv:4873

# replace this with your application's default port
EXPOSE 1337

CMD ["node", "/src/bin/jms.js", "--config", "local"]