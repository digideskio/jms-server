#!/bin/sh




USTREAM_PATH="/www/ustream.tv/git"
IMAGE_NAME="necccc/jms-server"
LOCAL_PORT=1337


USAGE="Usage: $0 {start|stop|restart|status|rebuild|teardown|init}"


init_docker() {
    echo "Init docker vm"
    boot2docker init

    echo "NAT port to localhost"
    vboxmanage modifyvm boot2docker-vm --natpf1 "http,tcp,127.0.0.1,1337,,1337"

    echo "Boot docker vm with ustream repo"
    boot2docker --vbox-share="/www/ustream.tv/git=ustream" up

    echo "Mount repo in vm"
    boot2docker ssh 'sudo mkdir -p /www/ustream.tv/git && sudo mount -t vboxsf ustream /www/ustream.tv/git'

    echo "Init shell"
    $(/usr/local/bin/boot2docker shellinit)
}

build_it() {
    echo "Building container"
    docker build -t necccc/jms-server .
}

run_it() {
    echo "Running container"
    docker run -d --name jms -p 1337:1337 -v /www/ustream.tv/git:/www/ustream.tv/git necccc/jms-server
}


start_it() {
    echo "Starting container..."
    docker start jms
}


stop_it() {
    echo "Stopping container..."
    docker stop jms
}

rebuild_it() {
    echo "Initiated rebuild"
    stop_it
    docker rm jms
    build_it
    run_it
}

restart_it() {
    echo "Restarting container..."
    docker stop jms
    docker rm jms
    run_it
}

status_app() {
    echo "Status"
}

burn_it() {
    echo "Some men just want to watch the world burn..."
    docker stop jms
    docker rm jms
    boot2docker poweroff
    boot2docker delete
}

case "$1" in
    start)
        start_it
    ;;

    stop)
        stop_it
    ;;

    restart)
        restart_it
    ;;

    status)
        status_app
    ;;

    rebuild)
        rebuild_it
    ;;

    teardown)
        burn_it
    ;;

    init)
        init_docker
        build_it
        run_it
    ;;

    *)
        echo $USAGE
        exit 1
    ;;
esac