require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const dns = require("dns");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const store = {}

function getShortURL(original_url) {
  // if store contains the original_url return its key(short url)
  if (Object.values(store).includes(original_url)) {
    return Object.keys(store).find(key => store[key] == original_url);
  }

  //create a new short url
  const short_url = Math.floor(Math.random() * 10000);
  while (Object.keys(store).includes(short_url)) // make sure it's unique
    short_url = Math.floor(Math.random() * 10000);

  return short_url;
}

//TODO make it work asyncronously
function lookUpURL(url) {
  setTimeout(()=>{
  let res = null;
  const options = {
    family: 4,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };
    dns.lookup(url, options, (error, address, family)=>{
      console.log('url: %s address: %j family: IPv%s', url, address, family);
      if (error) {
        console.log("error", error);
        res = error;
      } 
    });
    return res;
  }, 2000)

}

app.post('/api/shorturl/', (req, res, next) => {
  console.log(req.body.url);
  let url = req.body.url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const options = {
    family: 4,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };
  dns.lookup(url, options, (error, address, family)=>{
    console.log('url: %s address: %j family: IPv%s', url, address, family);
    if (error) {
      console.log("error", error);
      res.json({"error": "Invalid URL"});
    } else {
      next();
    }
  });
});



app.post('/api/shorturl/', (req, res) => {
  const original_url = req.body.url;
  const short_url = getShortURL(original_url);

  store[short_url] = original_url;
  console.log(store);

  res.json({
    "original_url": original_url,
    "short_url": short_url
  });
});

app.get("/api/shorturl/:url", (req, res, next) => {
  let url = store[req.params.url];
  if (url) {
    console.log("redirect here: " + store[url]);
    if (!url.startsWith("http"))
      url = 'https://' + url;
    res.redirect(302, url);
  } else res.json({"no such link": req.params.url})
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
