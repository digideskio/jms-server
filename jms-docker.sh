#!/bin/sh




USTREAM_PATH="/www/ustream.tv/git"
IMAGE_NAME="necccc/jms-server"
LOCAL_PORT=1337


USAGE="Usage: $0 {start|stop|restart|status|rebuild|teardown|init}"


init_docker() {

    echo "Init docker vm"
    boot2docker init

    #echo "NAT port to localhost"
    #vboxmanage modifyvm boot2docker-vm --natpf1 "http,tcp,127.0.0.1,1337,,1337"

    echo "Boot docker vm with ustream repo"
    boot2docker --vbox-share="/www/ustream.tv/git=ustream" up

    echo "Mount repo in vm"
    boot2docker ssh 'sudo mkdir -p /www/ustream.tv/git && sudo mount -t vboxsf ustream /www/ustream.tv/git'

    echo "Init shell"
    $(/usr/local/bin/boot2docker shellinit)

    echo "Port forwarding using ssh"
    boot2docker ssh -f -nNTL *:1337:localhost:1337 > /dev/null

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
    if is_running
        then
            echo "Already running"
        else
            docker start jms
        fi
}


stop_it() {
    echo "Stopping container..."
    if is_running
    then
        docker stop jms
    else
        echo "Not running"
    fi
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
    stop_it
    docker rm jms
    run_it
}


is_running() {
    status="`docker inspect jms |grep Running | awk '{print $2}'|sed s/\,//g`"
    [ "$status" = "true" ]
}


is_intialized() {
    state="`boot2docker info|grep State|awk '{ print $2 }'|sed s/\\"//g|sed s/\,//g`"
    [ "$state" = "running" ]
}

status_app() {
    echo "Status"
}

init() {
    if is_intialized
    then
        echo "Already initialized"
    else
        init_docker
        build_it
        run_it
    fi
}

burn_it() {
    echo "Some men just want to watch the world burn..."
    stop_it
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
        init
    ;;

    *)
        echo $USAGE
        exit 1
    ;;
esac
