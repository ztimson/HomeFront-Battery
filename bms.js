const SerialPort = require('serialport');

module.exports = class BMS {
	constructor(tty) {
		this.modules = {};
		this.port = new SerialPort(tty);
		this.serialParser = this.port.pipe(new SerialPort.parsers.Readline());
		this.serialParser.on('data', rx => this.postprocess(rx));
	}

	close() {
		this.serialParser.removeAllListeners();
		this.port.close();
	}

	data() {
		return {
			ampHorus: this.ampHours,
			avgCellVoltage: this.avgCellVoltage,
			avgTemp: this.avgTemp,
			capacity: this.capacity,
			current: this.current,
			lifetimeCharging: this.lifetimeCharging,
			lifetimeDischarg: this.lifetimeDischarg,
			maxCellVoltage: this.maxCellVoltage,
			maxChargeCurrent: this.maxChargeCurrent,
			maxDischargeCurrent: this.maxDischargeCurrent,
			maxVoltage: this.maxVoltage,
			minCellVoltage: this.minCellVoltage,
			minVoltage: this.minVoltage,
			modules: this.modules,
			negativeContractor: this.negativeContactor,
			positiveContactor: this.positiveContactor,
			power: this.power,
			soc: this.soc,
			uptime: this.uptime,
			version: this.version,
			voltage: this.voltage,
			wattHours: this.wattHours
		}
	}

	postprocess(rx) {
		// BMS Software Version
		let version = new RegExp(/Version (\d(?:\.\d+)?)/g).exec(rx);
		if(!!version) this.version = Number(version[1]);

		// Uptime
		let uptime = new RegExp(/Runtime:\s*(.*?)\s*\*/g).exec(rx);
		if(!!uptime) this.uptime = uptime[1];

		// Modules
		let module = new RegExp(/Module (\d+): (-?\d+(?:\.\d+)?)V (-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)C/g).exec(rx);
		if(!!module) {
			let id = Number(module[1]);
			let voltage = Number(module[2]);
			let negTemp = Number(module[3]);
			let posTemp = Number(module[4]);

			// Module data
			this.modules[id] = {
				cells: {},
				voltage: voltage,
				negTermTemp: negTemp,
				posTermTemp: posTemp,
				temp: (negTemp + posTemp) / 2
			}

			// Cell data
			let cell, cellRegEx = new RegExp(/Cell(\d+):(-?\d+(?:\.\d+)?)V/g);
			while((cell = cellRegEx.exec(rx)) != null) {
				this.modules[id].cells[Number(cell[1])] = Number(cell[2]);
			}
		}

		// Status
		let status = new RegExp(/PACK STATUS:(.*?) Modules: (\d+) Voltage: (-?\d+(?:\.\d+)?)v Avg Cell: (-?\d+(?:\.\d+)?)v Avg Temp: (-?\d+(?:\.\d+)?)C SOC: (-?\d+(?:\.\d+)?)%/g).exec(rx);
		if(!!status) {
			this.status = status[1];
			// this.moduleCount = Number(status[2]); // Use this.modules.length instead
			this.voltage = Number(status[3]);
			this.avgCellVoltage = Number(status[4]);
			this.avgTemp = Number(status[5]);
			this.soc = Number(status[6]) / 100;
		}

		// Power
		let power = new RegExp(/CURRENT: (-?\d+(?:\.\d+)?)A POWER: (-?\d+(?:\.\d+)?) Watts\s+AMPHOURS: (-?\d+(?:\.\d+)?) Ah\s+WATTHOURS: (-?\d+(?:\.\d+)?) Wh/g).exec(rx);
		if(!!power) {
			this.current = Number(power[1]);
			this.power = Number(power[2]);
			this.ampHours = Number(power[3]);
			this.wattHours = Number(power[4]);
		}

		// Charge/Discharge
		let minMax = new RegExp(/Max System Discharge Current: (-?\d+(?:\.\d+)?)A Max System Charge Current: (-?\d+(?:\.\d+)?)A/g).exec(rx);
		if(!!minMax) {
			this.maxDischargeCurrent = Number(minMax[1]);
			this.maxChargeCurrent = Number(minMax[2]);
		}

		// Pack Min/Max
		let packMinMax = new RegExp(/Max Pack Voltage: (-?\d+(?:\.\d+)?)vdc Min Pack Voltage: (-?\d+(?:\.\d+)?)vdc/g).exec(rx);
		if(!!packMinMax) {
			this.maxVoltage = Number(packMinMax[1]);
			this.minVoltage = Number(packMinMax[2]);
		}

		// Cell Min/Max
		let cellMinMax = new RegExp(/Current High Cell Voltage: (-?\d+(?:\.\d+)?)V Low Cell Voltage: (-?\d+(?:\.\d+)?)V/g).exec(rx);
		if(!!cellMinMax) {
			this.maxCellVoltage = Number(cellMinMax[1]);
			this.minCellVoltage = Number(cellMinMax[2]);
		}

		// Capicity
		let capacity = new RegExp(/Configured Battery Capacity: (-?\d+(?:\.\d+)?)Ah/g).exec(rx);
		if(!!capacity) this.capacity = Number(capacity[1]);

		// Lifetime
		let lifetime = new RegExp(/Battery Lifetime Charging: (-?\d+(?:\.\d+)?) kWh\s+Discharging: (-?\d+(?:\.\d+)?) kWh/g).exec(rx);
		if(!!lifetime) {
			this.lifetimeCharging = Number(lifetime[1]);
			this.lifetimeDischarg = Number(lifetime[2]);
		}

		// Contactors
		let contactor = new RegExp(/\s+(\w+) Contactor:(\w+)/g).exec(rx);
		if(!!contactor) this[contactor[1].toLowerCase() + 'Contactor'] = contactor[2] == 'ON';
	}

}
