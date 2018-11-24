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

(async () => {
	// Get document and data
	let doc = await firestore.collection('Battery').doc(namespace).get();
	let data = doc.data();

	// Wait for sensor data
	let serialParser = port.pipe(new SerialPort.parsers.Readline());
	serialParser.on('data', async arduino => {
		let sensorData = arduino.match(/\d+\.?\d*/g);

		// Divide data into modules
		let moduleCount = 0;
		data.modules = sensorData.reduce((acc, val, i, arr) => {
			if(i % 2 == 1) return acc;

			// Figure out module namename
			moduleCount++;
			let name = `Module ${moduleCount}`;

			// Format data
			if(!acc[name]) acc[name] = [];
			acc[name].push({charge: Number(val), temp: Number(arr[i + 1])});
			acc[name].splice(0, acc[name].length - 1440);

			// Return data
			return acc;
		}, data.modules || {});

		// Turn the relay on/off
		let turnOn = sensorData.filter((ignore, i) => i % 2 == 1).filter(temp => temp >= (data.relayOn || 50)).length > 0;
		let turnOff = sensorData.filter((ignore, i) => i % 2 == 1).filter(temp => temp <= (data.relayOff || 35)).length > 0;
		if(turnOn) port.write(1);
		if(turnOff && !turnOn) port.write(0);

		// Update the database
		try {
			await doc.ref[doc.exists ? 'update' : 'set'](data);
			console.log('worked');
			process.exit();
		} catch(err) {
			console.log(err);
			process.exit(1);
		}
	});
})();
