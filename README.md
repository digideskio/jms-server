# JavaScript Module Server

An AMD module server for Javascript, that handles dependencies and bundles on-the-fly using negative loading, based on Hapijs.

* [Usage](#usage)
* [Configuration options](#configuration)
* [How it works](#how-it-works)
* [Client](#client)
* [Local development](#local-development)
* [API](#api-1)
* [Internal modules](#internal-modules)
* [Plugins](#plugins)

## Usage

Make sure to check out the example repository, with working examples of the workflow there.

Deploy some code

```
$ npm install jms-deploy
```
Use the same configuration as for the server, to deploy your code.

```
var jmsDeploy = require('jms-deploy');

jmsDeploy({
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
}, function (err) {
	if (err) throw Error('Deploy error!')
	
	console.log('done!')
});
```

Set up you server

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
$ node index.js &
```

Check

## Configuration

JMS waits for a configuration object, made of these properties:

##### codebase

Codebase related options, currently only the source property is used, to store all the codebase references of your project

```
{
  codebase: {
    source: {
	  // your code source named "site"
      'site': { 
	  
	    // JMS keeps up to this many versions 
	    // of your code over deployments
        versions: 5, 
      
        // basePath of the modules in this source
        root: '/www/site/js/' 
      }
    }
  }
},

```

##### network

Network parameters for JMS server to listen on

```
network: {
	host: '0.0.0.0',
	port: 8080
}

```

##### storage

In production, JMS stores and serves modules from a dedicated storage.
This is implemented in the [jms-storage]() module, where currently the following storages are supported: 

- redis

This configuration is passed on to the jms-storage module, so here you can define the storage itself, and any parameter that is needed.

```
storage: {

	redis: {
		host: '127.0.0.1',		    
		port: 6379,
		database: 1
	}

}
```

##### cache 

JMS is based on HapiJS,  so here you can define any cache modules that is made for Hapi. By default it uses [catbox-redis]()

```
cache: {
	enabled: true,
	shared: true,
	engine: 'catbox-redis',
	host: '192.168.80.125',
	port: 6379,
	database: 2
}
```

##### debug

JMS use the [npmlog]() module for logging,
here you can set the loglevel

```
{
	// set logging level verbose|info|warn|error
	loglevel: 'verbose',
}
```

##### api

JMS exposes an API, to check and access modules, module versions, hashmaps. These can be used for integration with your systems (as we use it), and debugging.

The default API itself is created using swagger, and deployed in the [jms-api]() module

```
api: require('jms-api')
```

For more information about the API, see the [API section]()

##### plugins

Plugins can be used to access and modify module data during deploy and during serving modules.

The configuration accepts an array of plugins, each item as follows

```
plugins: [

	{
		module: require('jms-plugin-example'),
		name: 'example',
		enabled: true,
		options: {
			option_for_plugin: 'foo'
		}
	}

],

```
For more information about plugins, their structure, see the [Plugins]() section


##### context

You can tell JMS to work from your local codebase on disk, instead of accessing modules in the storage. This is useful during development, when the deployment step gets in your way. Local context means, that the module loading is the same as in production, but without module hashing and code minification. See [Local development](link)

```
context: {

	// local context will read modules from file on each request
	// to support development on local machines
	local: false

}
```	


## How it works



## Client

client embed

client bundle

hash mapping

multiple codebase scopes

## Local development

## API

## Internal modules


##### Submodules

 - [jms-storage](https://github.com/ustream/jms-storage)
 - [jms-api](https://github.com/ustream/jms-api)

##### Plugins

- [jms-plugin-example](https://github.com/ustream/jms-plugin-example)

##### Deploying

- jms-deploy

## Plugins