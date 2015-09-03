#!/bin/sh

node tests/scripts/setup-redis.js
status="$?"

if  [ "$status" != 0 ]; then
    exit "$status"
fi

echo "Test redis has been set up"

node tests/scripts/start-server.js &
pid="$!"
status="$?"

if  [ "$status" != 0 ]; then
    exit "$status"
fi

echo "Server running with pid $pid"

sleep 1

echo "Running tests..."
mocha --ui tdd --config test tests/integration/*.js

echo "Shutting down server"

kill -9 "$pid"
status="$?"

if  [ "$status" != 0 ]; then
    echo "Could not shut down server properly"
fi

node tests/scripts/flush-redis.js
status="$?"

if  [ "$status" != 0 ]; then
    echo "Could not flush the test redis properly"
fi

echo "Test redis cleared"