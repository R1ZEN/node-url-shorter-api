const express = require('express');
const memjs = require('memjs');
const hash = require('crypto').createHash;
const urlBuilder = require('url');

const ONE_HOUR = 3600;
const TIMEOUT_TO_WRITE_IN_CACHE = 2000;
const PORT = process.env.PORT || 3000;
const MEMCACHED_URI = process.env.MEMCACHED_URI || 'localhost:11211';

const app = express();
const memcached = memjs.Client.create(MEMCACHED_URI);

const toLogString = (logObj) => {
  return Object.keys(logObj).reduce((acc, key) => {
    return `${acc} ${key}=${JSON.stringify(logObj[key])} `;
  }, `[${new Date().toUTCString()}] `);
}

app.get('/', (req, res) => {
  res.send('To make URL shorter call http://localhost:3000/short?url=http://...');
});

/**
 * To make url shorter call http://localhost:3000/short?url=http://...
 */
app.get('/short', (req, res) => {
  const url = req.url;
  const queryUrl = req.query.url;
  const host = req.get('host');
  const protocol = req.protocol;

  if (!queryUrl) {
    const msg = 'Error: empty "url" query param'
    res.send(msg);
    console.error(toLogString({ message: msg, url }))

    return;
  }

  const urlHash = hash('sha1').update(queryUrl).digest('base64').slice(0,10)

  const timeoutId = setTimeout(() => {
    const msg = 'Error: timeout to store url in db';
    res.send(msg);
    console.error(toLogString({ message: msg, url }))
  }, TIMEOUT_TO_WRITE_IN_CACHE);

  memcached.set(urlHash, queryUrl, { expires: ONE_HOUR }, (err, result) => {
    if (err) {
      const msg = `Error: ${err}`
      res.send(msg);
      console.error(toLogString({ message: msg, url }))

      return;
    }

    clearTimeout(timeoutId);

    if (result) {
      res.send(urlBuilder.format({
        protocol,
        host,
        port: PORT,
        pathname: urlHash
      }));
    }
  })
})

/**
 * Redirect to particular url
 */
app.get('/:urlHash', (req, res) => {
  const url = req.url;
  const urlHash = req.params.urlHash;

  if (!urlHash) {
    const msg = 'Error: urlHash doesnt exist';
    res.send(msg);
    console.error(toLogString({ message: msg, url }));
  }

  memcached.get(urlHash, (err, data) => {
    if (err) {
      const msg = `Error: ${err}`;
      res.send(msg);
      console.error(toLogString({ message: msg, url }));

      return;
    }

    console.info(toLogString({ message: `Redirect to ${data}`, url }));
    res.redirect(data);
  });
})

app.listen(PORT, () => {
  console.info(toLogString({ message: `URL Shorter listening at http://localhost:${PORT}` }));
});
