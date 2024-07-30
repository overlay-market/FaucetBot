const https = require('https');

module.exports = (evmTxHash) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      id: "1",
      jsonrpc: "2.0",
      method: "debug_getMoveHash",
      params: [evmTxHash]
    });

    const options = {
      hostname: 'mevm.devnet.imola.movementlabs.xyz',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result.result);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};
