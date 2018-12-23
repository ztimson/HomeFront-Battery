const fs = require('fs');
const SerialPort = require('serialport');
const firebase = require('firebase');

const namespace = fs.readFileSync('/etc/hostname', 'utf8').trim();
const port = new SerialPort('/dev/ttyUSB0');
const serialParser = port.pipe(new SerialPort.parsers.Readline());

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

var modules; // Where the latest data is stored
serialParser.on('data', async serialIn => {
	let sensorData = serialIn.match(/\d+\.?\d*/g);

	// Divide data into modules
	let moduleCount = 0;
	modules = sensorData.reduce((acc, val, i, arr) => {
		if(i % 2 == 1) return acc;

		// Construct data set
		moduleCount++;
		let name = `Module ${moduleCount}`;
		acc[name] = {charge: Number(val), temp: Number(arr[i + 1])};
		return acc;
	}, {});
});

setInterval(async () => {
	if(!modules) return;

	let doc = await firestore.collection('Battery').doc(namespace).get();
	let data = Object.assign({config: {}, modules: {}}, doc.data());
	const config = data.config;

	// Add latest data
	Object.keys(modules).forEach(key => {
		if(!data.modules[key]) data.modules[key] = [];
		data.modules[key].push(modules[key]);
		data.modules[key].splice(0, data.modules[key].length - 1440);
	});

	// Turn the relay on/off
	/* if(config.relayMode != null) {
		console.log(config.relayMode, Number(config.relayMode));
		port.write(Number(config.relayMode).toString());
	} else {
		let turnOn = sensorData.filter((ignore, i) => i % 2 == 1).filter(temp => temp >= (config.relayOn || 50)).length > 0;
		let turnOff = sensorData.filter((ignore, i) => i % 2 == 1).filter(temp => temp <= (config.relayOff || 35)).length > 0;
		if(turnOn) port.write([1]);
		if(turnOff && !turnOn) port.write([0]);
	}*/

	// Submit
	doc.ref[doc.exists ? 'update' : 'set'](data);
}, 60000);
