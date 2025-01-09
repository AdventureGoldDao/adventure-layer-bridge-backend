const http = require('http');
const {do_transaction, listen_deposit_events} = require('./listen')
const queue = []; // Simulated queue

// Function to process data from the queue
function processQueue() {
  if (queue.length > 0) {
    const data = queue.shift(); // Get the first item from the queue
    console.log('shift queue data:', data.contract.chainConfig.name , data.contract.address,data.address,data.amount);
    // Add your data processing logic here
    do_transaction(
        data.contract,
        data.address,
        data.amount,
    );
  } else {
    //console.log('No data to process');
  }
}



// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'get' && req.url === '/status') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'listen server is on' }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

// Start the server
const PORT = 8501;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    try{

        // Set up an interval to check the queue every 1 second
        setInterval(processQueue, 1000);

        //listen events and add data to queue
        listen_deposit_events(queue);
    }
    catch (err) {
		console.error('Error:', err);
	}

});
