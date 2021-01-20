'use strict';
var util = require('util');

// Deps
const Path = require('path');
const JWT = require(Path.join(__dirname, '..', 'lib', 'jwtDecoder.js'));
var util = require('util');
var http = require('https');
//var sync = require('synchronize');

const { Client } = require('pg');
const client = new Client({
	  connectionString: process.env.DATABASE_URL,
	  ssl: true,
	});
client.connect();

exports.logExecuteData = [];

function logData(req) {
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
    console.log("body: " + util.inspect(req.body));
    console.log("headers: " + req.headers);
    console.log("trailers: " + req.trailers);
    console.log("method: " + req.method);
    console.log("url: " + req.url);
    console.log("params: " + util.inspect(req.params));
    console.log("query: " + util.inspect(req.query));
    console.log("route: " + req.route);
    console.log("cookies: " + req.cookies);
    console.log("ip: " + req.ip);
    console.log("path: " + req.path);
    console.log("host: " + req.host);
    console.log("fresh: " + req.fresh);
    console.log("stale: " + req.stale);
    console.log("protocol: " + req.protocol);
    console.log("secure: " + req.secure);
    console.log("originalUrl: " + req.originalUrl);
	console.log("headers inspect: " + util.inspect(req.headers) );
	console.log("headers stringify: " + JSON.stringify( req.headers  ));
	/*
	var buf = Buffer.from(util.inspect(req.body));  
	console.log("body no inspect: " + req.body);	
	console.log("body buffer: " + buf.toString());
	
	var j2 = buf.toJSON();
	console.log("body json: " + JSON.stringify(j2) );
	
	var j3 = buf.toJSON();
	console.log("body json: " + JSON.stringify(buf.toString()) );
	*/
	//let j1 = JSON.stringify(buf);
	//console.log("body json: " + j1 );
	
}

function insertActivityLog(pl) {
	client.connect();
	var qry = 'CALL insert_activity_log ( \'HourlyBatch\' ,  \'JBInbound\',\''+ pl+'\',\'Log\' )';
	client.query(qry, (err, res) => {
	  if (err) throw err;
	  for (let row of res.rows) {
		console.log(JSON.stringify(row));
	  }
	  client.end();
	});
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function (req, res) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    logData(req);
    res.send(200, 'Edit');
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function (req, res) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    logData(req);
    res.send(200, 'Save');
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function (req, res) {
	
    // example on how to decode JWT
    JWT(req.body, process.env.jwtSecret, (err, decoded) => {

        // verification error -> unauthorized request
        if (err) {
            console.error(err);			
            return res.status(401).end();
        }

        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            
            // decoded in arguments
            var decodedArgs = decoded.inArguments[0];            
            logData(req);
			console.log( JSON.stringify(  decodedArgs  ));
			console.log( JSON.stringify(  decoded  ));
			insertActivityLog(JSON.stringify(  decodedArgs  ));
            res.send(200, 'Execute');
        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
};


/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function (req, res) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    logData(req);
    res.send(200, 'Publish');
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function (req, res) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    logData(req);
    res.send(200, 'Validate');
};


exports.resolveToken = function (req, res) {

	var bd = req.body;
	
	//console.log ( util.inspect( req.headers) );
	var un = req.headers['username'];
	var pw = req.headers['password']; 
	var auth = req.headers['authorization'];
	var valid = false;
	if (un == '123' && pw =='123'){
		valid=true;
	}else if (auth = 'Basic MTIzOnF3ZQ==') {
		valid=true;
	}
	
	if (!valid ){
		 res.status(401).send('Authentication not passed.');
		return;
	}
	console.log ('REQUEST BODY'+ util.inspect (bd.tokens));

  //  logData(req);
		 
	var jresp = {};
	jresp.resolvedTokens=[];
	jresp.unresolvedTokens=[];
	var tokens  = bd['tokens'];
	var tokenArray = [];
	var resultArray = [];
	var requestTokenMap = new Map();
	var tokenValueMap = new Map();
	for(var j = 0;j<tokens.length;j++){
		var tokenRequestID = tokens[j].tokenRequestId;
		tokenArray.push (tokens[j].token );
		requestTokenMap.set (tokenRequestID, tokens[j].token);
	}
	for (var i =0;i<450;i++){
		var ranInt =Math.floor((Math.random()*10000)+1); 
		var t = 'tkn'+ (i+ranInt)+'@dtt.com.cn';
		tokenArray.push (t);
		requestTokenMap.set (t,t);
	 }
	
	var channel = 'Email';
	var sendKey = bd['sendKey'];
	if (sendKey.includes('mobile')){
		channel = 'Mobile';
	}
	client.query( 'select * from public.resolve_token_batch($1 ,$2 ) ',[channel, tokenArray] ,(err, resp) => {
	  if (err) throw err;
	  for (let row of resp.rows) {
		//console.log(JSON.stringify(row));
		tokenValueMap.set (row.token, row.tokenvalue);

	  }
	  
	 
	
	 for (var pair of requestTokenMap){
		var key = pair[0];
		var val = pair[1];

		var item = {};
		item.tokenRequestId = key;
		var tknVal = tokenValueMap.get(val);	

		if (tknVal != null ){
			item.tokenValue = tknVal;
			item.attributes = [{"name":"First_Name","value":"static_firstName"},{"name":"myAttr1","value":"myVal1"}]; 		  
			jresp.resolvedTokens.push (item);
		}else{
			item.message = 'Invalid token; token does not exist.';
			jresp.unresolvedTokens.push(item);
		}
	 } 
	  console.log( 'RESPONSE BODY: ' +JSON.stringify(jresp) );
	 // res.setHeader('Content-Type', 'application/json;charset=utf-8');
	  res.status(200).send(JSON.stringify(jresp));
	}) 
 
};
/*
function resolveArray(type, tokenArray) {
	client.connect();
	//var qry = 'CALL insert_activity_log ( \'HourlyBatch\' ,  \'JBInbound\',\''+ pl+'\',\'Log\' )';
	client.func( 'resolve_token_batch',[type, tokenArray] ,(err, res) => {
	  if (err) throw err;
	  for (let row of res.rows) {
		console.log(JSON.stringify(row));
	  }
	  client.end();
	});
}*/
