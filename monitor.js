const fs = require('fs');
const SerialPort = require('serialport');
const firebase = require('firebase');

const namespace = fs.readFileSync('/etc/hostname', 'utf8').trim();
const port = new SerialPort('/dev/ttyUSB0');

firebase.initializeApp({
	apiKey: "AIzaSyAs3FvBCADM66wR1-leBz6aIjK1wZfUxRo",
	authDomain: "homefront-2ccb4.firebaseapp.com",
	databaseURL: "https://homefront-2ccb4.firebaseio.com",
	projectId: "homefront-2ccb4",
	storageBucket: "homefront-2ccb4.appspot.com",
	messagingSenderId: "482384317544"
});
const firestore = firebase.firestore();
firestore.settings({timestampsInSnapshots: true});

function getData() {
	return new Promise(res => {
		let serialParser = port.pipe(new SerialPort.parsers.Readline());
		serialParser.on('data', serialIn => {
			// Format data
			console.log(`(${(new Date()).toISOString()}) Input: ${serialIn}`);
			let sensorData = serialIn.match(/\d+\.?\d*/g);
			if(sensorData.length % 2 == 1) return;

			// Split data & find averages
			let chargeData = sensorData.filter((v, i) => i % 2 == 0);
			let tempData = sensorData.filter((v, i) => i % 2 == 1);
			let chargeAvg = chargeData.reduce((acc, val) => acc + val, 0) / chargeData.length;
			let tempAvg = tempData.reduce((acc, val) => acc + val, 0) / tempData.length;

			// Check data for signs of corruption
			if(Math.sqrt(chargeData.reduce((acc, val) => acc + (val - chargeAvg) ** 2, 0) / (chargeData.length - 1)) > 3) return;
			if(Math.sqrt(tempData.reduce((acc, val) => acc + (val - tempAvg) ** 2, 0) / (tempData.length - 1)) > 3) return;
			
			// Submit the data
			let data = {
				timestamp: new Date(), 
				payload: chargeAvg.map((charge, i) => ({charge: Number(charge), temp: Number(tempData[i])}))
			};
			console.log(`(${(new Date()).toISOString()}) Output: ${JSON.stringify(data)}`);
			res(data);
		});
	});
}

(async() => {
	// Init
	let data = await getData();
	let doc = await firestore.collection('Battery').doc(namespace).collection('data').doc(data.timestamp.getTime());

	// Add latest data
	console.log(`(${(new Date()).toISOString()}) Saving...`);
	await doc.ref.set(data.reduce((acc, row, i) => {
		const key = `Module ${i + 1}`;
		acc[key] = row;
	}, {}));
	console.log(`(${(new Date()).toISOString()}) Saved`);

	// Submit
	process.exit();
})();
