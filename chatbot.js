var http = require('http'),
    qs = require('querystring'),
    location = '__SERVER_LOCATION__',
    port = '3000'
    last_message = "",
    bot_name = 'DevBot',
    options = {
      host: location,
      port: port,
      path: '/latest'
    };

var listen = function () {
  http.get(options, function (res) {
    res.on('data', function (data) {
      var received = data.toString();

      if (received != last_message) {
        last_message = received;
        var msg = received.slice(received.indexOf(':') + 1).trim();
        if (msg.toLowerCase().indexOf(bot_name.toLowerCase()) === 0) {
          var cmd = msg.slice(msg.indexOf(':') + 1).trim();
          processCommand(cmd);
        }
      };
    });
  }).on('error', function (e) {
    console.log('Got error: ' + e.message);
  });    
};

var parrot = function (msg) {
  respondWith(msg);
  return;
};

var imageMe = function (q, cb) {
  http.get({
    host: 'ajax.googleapis.com',
    path: '/ajax/services/search/images?v=1.0&rsz=8&safe=active&q=' + qs.escape(q),
  }, function (res) {
    var res_data = "";

    // Keep reading from the stream and 
    // building the result data until the
    // Google server says it's done
    res.on('data', function (data) {
      res_data += data.toString();
    });

    res.on('end', function () {
      // We have all the data. Parse the first result
      // and send it to the chat
      var images = JSON.parse(res_data);    
      images = images.responseData.results;
      
      var rdm_idx = Math.floor(Math.random() * images.length);
      image = images[rdm_idx];
      cb(image.unescapedUrl);
    });
  }).on('error', function (e) {
    console.log('Got error in image getter: ' + e.message);
  });
};

var mustachifyMe = function (q, cb) {
  imageMe(q, function (img_url) {
    cb('http://mustachify.me/?src=' + img_url);    
  });  
};

// Processes the commands and responds with
// the appropriate coolness
var processCommand = function (command) {
  var matches;

  // Parrot 
  // Responds back with whatever it sent to it
  matches = command.match(/(parrot)( me)? (.*)/i);
  if (matches) {
    var arg = matches[3];
    respondWith(arg);
    return;
  }

  // Image me
  // Responds back with the first google image result
  // it finds based on the query
  matches = command.match(/(image|img)( me)? (.*)/i);
  if (matches) {
    imageMe(matches[3], function (img_url) {
      respondWith('<p /><img src="' + img_url + '" />');
    });
    return;
  }

  // Mustachify
  matches = command.match(/(mustachify)( me)? (.*)/i);
  if (matches) {
    mustachifyMe(matches[3], function (img_url) {
      respondWith('<p /><img src="' + img_url + '" />');
    });
    return;
  };

  // Fallback command
  // Each command before this should return so that we don't get here
  // If we do get here, it means somebody issued a command that isn't real
  console.log('executing fallback');
  respondWith("I don't know about you, but I don't do that kind of thing");
};

// Communicates back to the server
var respondWith = function (res_msg) {
  var res_opts = {
    host: location,
    port: port,
    path: '/post',
    method: 'POST'
  };

  var req = http.request(res_opts, function (res) {
    // Server response
    res.setEncoding('utf8');
    res.on('data', function (data) {
      //console.log(data.toString());   // We actually probably don't care what response we get
    });
  });

  req.on('error', function (e) {
    console.log('DEV BOT GOT MESSED UP!');
    console.log(e.message);
  });

  var body = bot_name + ': ' + res_msg;
  req.write(body);
  req.end();
};

setInterval(listen, 500);
