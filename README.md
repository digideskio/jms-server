# JavaScript Module Server

An AMD module server for Javascript, that handles dependencies and bundles on-the-fly using negative loading, based on Hapijs.

### Usage

```
$ npm install jms-server
```

Create a file, like `index.js`, and configure your server

```
var jms = require('jms-server');

jms({
    codebase: {
      source: {
        'site': {
          versions: 5,
          root: '/www/site/js/'
        }
      }
    },
    network: {
      host: '0.0.0.0',
      port: 8080
    },
    storage: {
  		redis: {
  			host: '127.0.0.1',
  			port: 6379,
  			database: 1
  		}
    }
});
```

Run your server

```
$ node index.js
```


### Configuration

JMS waits for a configuration object, made of these properties:

codebase

network

storage

cache 

debug

api

plugins

context


### How it works



### Client

client embed

client bundle

hash mapping

multiple codebase scopes

### Local development


### API

### JMS modules


##### Submodules

 - jms-storage
 - jms-api

##### Plugins

- jms-plugin-example
- jms-plugin-ustreamlocales

##### Deploying

- jms-deploy