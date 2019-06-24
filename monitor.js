const fs = require('fs');
const SerialPort = require('serialport');
const firebase = require('firebase');

const namespace = fs.readFileSync('/etc/hostname', 'utf8').trim();
const port = new SerialPort('/dev/ttyUSB0', {autoOpen: false});

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
		port.open(() => {
			let serialParser = port.pipe(new SerialPort.parsers.Readline());
			serialParser.on('data', async serialIn => {
				// Format data
				let sensorData = serialIn.match(/\d+\.?\d*/g);
				let chargeData = sensorData.filter((v, i) => i % 2 == 0);
				let tempData = sensorData.filter((v, i) => i % 2 == 1);

				// Find averages for checks
				let chargeAvg = chargeData.reduce((acc, val) => acc, val, 0) / chargeData.length;
				let tempAvg = tempData.reduce((acc, val) => acc, val, 0) / tempData.length;

				// Check for validity
				if(serialIn.match(/[^\d|\.|\s]/g).length != 0) return;
				if(chargeData.length != tempData.length) return;
				if(Math.sqrt(chargeData.reduce((acc, val) => acc + (val - chargeAvg) ** 2, 0) / (chargeData.length - 1)) > 3) return;
				if(Math.sqrt(tempData.reduce((acc, val) => acc + (val - tempAvg) ** 2, 0) / (tempData.length - 1)) > 3) return;
				
				// Submit the data
				if(port.isOpen) port.close();
				let timestamp = new Date();
				res(chargeAvg.map((charge, i) => ({charge: Number(charge), temp: Number(tempData[i]), timestamp: timestamp})));
			});
		});
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
		const key = `Module ${i + 1}`;
		if(!data.modules[key]) data.modules[key] = [];
		data.modules[key].push(row);
		data.modules[key].splice(0, data.modules[key].length - 1440);
	});

	// Turn the relay on/off
	if(config.relayMode != null) {
		port.open(() =>
			port.write(config.relayMode ? 6 : 5, null, () =>
				port.close()));
	}

	// Submit
	await doc.ref.set(data);
	process.exit();
})();
