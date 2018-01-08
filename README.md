[![Build Status](https://travis-ci.org/larvit/larvituser-api.svg)](https://travis-ci.org/larvit/larvituser-api) [![Dependencies](https://david-dm.org/larvit/larvituser-api.svg)](https://david-dm.org/larvit/larvituser-api.svg)
[![Coverage Status](https://coveralls.io/repos/larvit/larvituser-api/badge.svg)](https://coveralls.io/github/larvit/larvituser-api)

# larvituser-api

REST http API module wrapper around the user library [larvituser](https://github.com/larvit/larvituser)

## Installation

```bash
npm i larvituser-api
```

## Code API Basic usage

In the file index.js:

```javascript
const	UserApi	= require('larvituser-api'),
	db	= require('larvitdb');

let	userApi;

db.setup({'db': 'options'});	// See https://github.com/larvit/larvitdb for details

userApi	= new UserApi({
	'db':	db,	// Must be a configured database instance
	'appOptions':	{},	// Will be passed directly to larvitbase. For more info see: https://github.com/larvit/larvitbase
	'intercom':	undefined,	// Or instance of larvitamintercom. For more info see: https://github.com/larvit/larvitamintercom
	'mode':	undefined,	// DataWriter mode, see larvituser for more info: https://github.com/larvit/larvituser
});

userApi.start(function (err) {
	if (err) throw err;
	console.log('API up and running!');
});
```

Then just start the file from shell:

```bash
node index.js
```

## REST API Endpoints

### GET /user

Fetch a specific user

#### Request URL parameters

One, and exactly one of the following is allowed:

* uuid: "uuid string"
* username: "string"

#### Response example on success

200 OK

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

#### Response body example on failure

404 Not Found

```json
"no matching user found"
```

### POST /user/login

Obtain a user by username and password. **Do not use this if your connection is not secure!**

#### Request body example

```json
{
	"username":	"string",
	"password":	"string"
}
```

#### Response body example on success

200 OK

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

#### Response body example on failure

404 Not Found

```json
"no matching user found"
```

### PUT /user

Create or replace a specific user, defined by uuid.

Some considerations:

* uuid URL parameter is optional. If left out a new user will be created.
* username, password and fields are all optional if the user already exists. If user does not exist, username is required.
* if fields is provided, it will completely replace all previous fields (if this is not desired, use PATCH instead)
* password: false is NOT the same as password: undefined! A false password will disable logins. undefined password will leave it as is (default is false for newly created users)

#### Request body example

```json
{
	"uuid":	"uuid string", // If left out a new user will be created and a random uuid given to it
	"username":	"foo",
	"password":	"bar" or false,
	"fields": {
		"name":	"Bosse",
		"lastname":	"Bengtsson"
	}
}
```

#### Response body example

201 Created
or
200 OK

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

### PATCH /user

Modify an existing user

Some considerations:

* uuid **must** be provided.
* username, password and fields are all optional
* If fields are present, only the named fields will be replaced. For example: if The above is saved, another update with {"fields": {"lastname": "Stark"}} would end in the saved fields as: {"fields": {"firstname": "Ove", "lastname": "Stark"}}
* password: false is NOT the same as password: undefined! A false password will disable logins. undefined password will leave it as is (default is false for newly created users)

#### Request body example

```json
{
	"uuid":	"uuid string",
	"username":	"foo",
	"password":	"bar" or false,
	"fields": {
		"name":	"Bosse",
		"lastname":	"Bengtsson"
	}
}
```

#### Response body example

200 OK

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

### DELETE /user

Remove a user from the database

#### Request body example

```json
{
	"uuid":	"uuid string"
}
```

#### Response body example

200 OK

```json
"acknowledged"
```

### DELETE /user/field

Remove a user field from database for a specific user

#### Request body example

```json
{
	"userUuid":	"uuid string",
	"fieldName":	"string"
}
```

#### Response body example

200 OK

```json
"acknowledged"
```

### GET /users

Fetch a list of users.

#### Request URL parameters

This is all optional, will only fetch users that matches **all** criterias.

* q:	"search the database, matching username, field values and/or exact match of uuid",
* limit:	"integer - how many results to retrieve, defaults to 100",
* offset:	"integer - how many initial results to skip",
* uuids:	"comma separated list of uuids",
* returnFields:	"comma separated list of field names. Will return the values for the fields listed. By default no fields are returned (since return fields is expensive)

#### Response body example

200 OK

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
