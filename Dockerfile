# boot2docker init
# boot2docker --vbox-share="/www/ustream.tv/git=ustream" up
# boot2docker ssh 'sudo mkdir -p /www/ustream.tv/git && sudo mount -t vboxsf ustream /www/ustream.tv/git'
# $(/usr/local/bin/boot2docker shellinit)
# docker build -t necccc/centos-jms-server .
# docker run -d --name jms -p 46160:1337 -v /www/ustream.tv/git:/www/ustream.tv/git necccc/centos-jms-server
# docker exec jms ls -l /www/ustream.tv/git



FROM    centos:centos6

# Enable EPEL for Node.js
RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
# Install Node.js and npm
RUN     yum install -y npm

# Bundle app source
COPY . /src

# Install app dependencies
RUN cd /src; npm install --registry http://sjc-npm-cache.ustream.tv:4873

# replace this with your application's default port
EXPOSE 1337

CMD ["node", "/src/bin/jms.js", "--config local"]