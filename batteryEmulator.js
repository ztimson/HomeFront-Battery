const SerialPort = require('serialport');
const firebase = require('firebase');

const namespace = '170614D';

firebase.initializeApp({
	apiKey: "AIzaSyAs3FvBCADM66wR1-leBz6aIjK1wZfUxRo",
	authDomain: "homefront-2ccb4.firebaseapp.com",
	databaseURL: "https://homefront-2ccb4.firebaseio.com",
	projectId: "homefront-2ccb4",
	storageBucket: "homefront-2ccb4.appspot.com",
	messagingSenderId: "482384317544"
});

(async () => {
	const ReadLine = SerialPort.parsers.Readline;
	const parser = new SerailPort('/dev/ttyUSB0').pipe(new Readline());
	
	let firestore = firebase.firestore();
	firestore.settings({timestampsInSnapshots: true})
	let data = (await firestore.collection('Battery').doc(namespace).get()).data();
	
	parser.on('data', dataIn => {
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
