const fs = require('fs');
const SerialPort = require('serialport');
const firebase = require('firebase');

const namespace = fs.readFileSync('/etc/hostname', 'utf8').trim();
const serialParser = new SerialPort('/dev/ttyUSB0').pipe(new SerialPort.parsers.Readline());

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

console.log(namespace);
(async () => {
	let doc = await firestore.collection('Battery').doc(namespace).get();
	serialParser.on('data', async dataIn => {
		let data = dataIn.match(/\d+\.?\d*/g);
		let moduleCount = 0;
		data = data.reduce((acc, val, i, arr) => {
			if(i % 2 == 1) return acc;
			moduleCount++;
			let name = `Module ${moduleCount}`;
			if(!acc[name]) acc[name] = [];
			acc[name].push({charge: Number(val), temp: Number(arr[i + 1])});
			acc[name].splice(0, acc[name].length - 1440);
			return acc;
		}, doc.data() || {});

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
