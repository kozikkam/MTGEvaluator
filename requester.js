const fs = require('fs');
const axios = require('axios');

const siteUrl = 'https://letters.execute-api.server.amazonaws.com/projectlink';

const getFile = () => fs.readFile('deck.txt', 'utf8', function(err, f) {
  if (err) rej(err);


  axios({
    method: 'post',
    url: siteUrl,
    data: {
      file: f,
    }
  }).then(data => console.log(data.data))
    .catch(err => console.log(err));
});

getFile();
