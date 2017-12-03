[![Build Status](https://travis-ci.org/larvit/larvituser-api.svg?branch=master)](https://travis-ci.org/larvit/larvituser-api) [![Dependencies](https://david-dm.org/larvit/larvituser-api.svg)](https://david-dm.org/larvit/larvituser-api.svg)

# larvituser-api

REST http API module wrapper around the user library [larvituser(https://github.com/larvit/larvituser)]

## Installation

```bash
npm i larvituser-api
```

## Basic usage

In the file index.js:

```javascript
const	UserApi	= require('larvituser-api'),
	db	= require('larvitdb');

let	userApi;

db.setup({'db': 'options'});	// See https://github.com/larvit/larvitdb for details

userApi	= new UserApi({
	'db':	require('larvitdb'),	// Must be a configured database instance
	'server':	{	// Will be passed directly to larvitbase. For more info see: https://github.com/larvit/larvitbase
		'port':	8080	// The only mandatory server option
	},
	'intercom':	undefined,	// Or instance of larvitamintercom. For more info see: https://github.com/larvit/larvitamintercom
	'mode':	undefined,	// DataWriter mode, see larvituser for more info: https://github.com/larvit/larvituser
});

userApi.start(function (err) {
	if (err) throw errr;
	console.log('API up and running!');
});
```

Then just start the file from shell:

```bash
node index.js
```

## REST API Endpoints

### GET /user?uuid=xxx

Fetch a specific user, identified by uuid

### POST /user

Create a new user

### PUT /user?uuid=xxx

Create or update a specific user, defined by uuid

### GET /users

Fetch a list of users
