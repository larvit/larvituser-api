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

#### Response example

```json
{
	"uuid": "uuid string",
	"username": "string",
	"fields": {
		"fieldName1": ["field value 1", "field value 2"],
		"some other field": ["other fields value"]
	}
}
```

### POST /user

Create a new user

#### Request body example

```json
{
	"username":	"foo",
	"password":	"bar" or false,
	"fields": {
		"firstname":	"Ove",
		"lastname":	["Arvidsson", "Stollesson"]
	}
}
```

Some considerations:

* Username must be non-empty and unique
* If password is false, fetching user by username and password bill be disabled

#### Response example

```json
{
	"uuid": "uuid string",
	"username": "foo",
	"fields": {
		"firstname": ["Ove"],
		"lastname": ["Arvidsson", "Stollesson"]
	}
}
```

### PUT /user?uuid=xxx

Create or update a specific user, defined by uuid.

Some considerations:

* uuid URL parameter is optional. If left out a new user will be created.
* username, password and fields are all optional if the user already exists. If user does not exist, username is required.
* if fields is provided, it will completely replace all previous fields (if this is not desired, use PATCH instead)
* password: false is NOT the same as password: undefined! A false password will disable logins. undefined password will leave it as is (default is false for newly created users)

#### Request body example

```json
{
	"username":	"foo",
	"password":	"bar" or false,
	"fields": {
		"name":	"Bosse",
		"lastname":	"Bengtsson"
	}
}
```

#### Response body example

```json
{
	"uuid": "uuid string",
	"username": "foo",
	"fields": {
		"name": ["Bosse"],
		"lastname": ["Bengtsson"]
	}
}
```

### PATCH /user?uuid=xxx

Modify an existing user

Some considerations:

* uuid URL parameter **must** be provided.
* username, password and fields are all optional
* If fields are present, only the named fields will be replaced. For example: if The above is saved, another update with {"fields": {"lastname": "Stark"}} would end in the saved fields as: {"fields": {"firstname": "Ove", "lastname": "Stark"}}
* password: false is NOT the same as password: undefined! A false password will disable logins. undefined password will leave it as is (default is false for newly created users)

#### Request body example

```json
{
	"username":	"foo",
	"password":	"bar" or false,
	"fields": {
		"name":	"Bosse",
		"lastname":	"Bengtsson"
	}
}
```

#### Response body example

```json
{
	"uuid": "uuid string",
	"username": "foo",
	"fields": {
		"name": ["Bosse"],
		"lastname": ["Bengtsson"]
	}
}
```

### DELETE /user?uuid=xxx

Remove a user from the database

No request body should be sent

#### Response body example

```json
"acknowledged"
```

### DELETE /user/field?userUuid=xxx&fieldName=yyy

Remove a user field from database for a specific user

No request body should be sent

#### Response body example

```json
"acknowledged"
```

### GET /users

Fetch a list of users.

#### Request body example

This is all optional, will only fetch users that matches **all** criterias.

```json
{
	"q":	"search the database, matching username, field values and/or exact match of uuid",
	"limit":	"integer - how many results to retrieve, defaults to 100",
	"offset":	"integer - how many initial results to skip",
	"uuids":	["uuid1", "uuid", "etc"],
	"returnFields":	["field1", "field2"] // Will return the values for the fields listed. By default no fields are returned (since return fields is expensive)
}
```

#### Response body example

```json
{
	"totalHits":	392,
	"hits": [
		{
			"uuid":	"uuid string",
			"username":	"bosse",
			"fields": {
				"field1":	["field value 1"]
			}
		},
		{
			"uuid":	"uuid string",
			"username":	"bengan",
			"fields": {
				"field1": ["foo"],
				"field": ["bar"]
			}
		}
	]
}
```
