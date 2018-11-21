const SerialPort = require('serialport');
const firebase = require('firebase');

const firestore = firebase.firestore();
const namespace = '170614D';
const serialParser = new SerialPort('/dev/ttyUSB0').pipe(new SerialPort.parsers.Readline());

firebase.initializeApp({
	apiKey: "AIzaSyAs3FvBCADM66wR1-leBz6aIjK1wZfUxRo",
	authDomain: "homefront-2ccb4.firebaseapp.com",
	databaseURL: "https://homefront-2ccb4.firebaseio.com",
	projectId: "homefront-2ccb4",
	storageBucket: "homefront-2ccb4.appspot.com",
	messagingSenderId: "482384317544"
});
firestore.settings({timestampsInSnapshots: true});

console.log('start');
(async () => {
	let data = (await firestore.collection('Battery').doc(namespace).get()).data();

	console.log(data);

	serialParser.on('data', async dataIn => {
		console.log(dataIn);
		let data = dataIn.match(/\d+\.?\d*/g);
		let moduleCount = 0;
		data = data.reduce((acc, val, i, arr) => {
			if(i % 2 == 1) return acc;
			moduleCount++;
			if(!acc[`Module ${moduleCount}`]) acc[`Module ${moduleCount}`] = [];
			acc[`Module ${moduleCount}`].push({charge: val, temp: arr[i + 1]});
		}, data);

		try {
			await firestore.collection('Battery').doc(namespace).update(data)
			process.exit();
		} catch(err) {
			process.exit(1);
		}
	});
})();
