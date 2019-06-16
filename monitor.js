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

function getData() {
	return new Promise(res => {
		serialParser.on('data', async serialIn => {
			let timestamp = new Date();
			let raw = serialIn.split(' ');
			let data = raw.reduce((acc, val, i, arr) => {
				if(i % 2 == 1) return acc;
				acc.push({charge: Number(val), temp: Number(arr[i + 1]), timestamp: timestamp});
				return acc;
			}, []);
			res(data);
		})
	});
}

(async() => {
	// Init
	let newData = await getData();
	let doc = await firestore.collection('Battery').doc(namespace).get();
	let data = Object.assign({config: {}, modules: {}}, doc.data());
	const config = data.config;

	// Add latest data
	newData.forEach((row, i) => {
		const key = `Module ${i}`;
		if(!data.modules[key]) data.modules[key] = [];
		data.modules[key].push(row);
		data.modules[key].splice(0, data.modules[key].length - 1440);
	});

	// Turn the relay on/off
	if(config.relayMode != null) {
		port.write(Number(config.relayMode).toString());
	}

	// Submit
	await doc.ref.set(data);
	process.exit();
})();
