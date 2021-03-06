const crypto = require('crypto');

const FC_REGEX = /[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}/;

// Code for FC validation written by Scotteh.

function sha1bin(data) {
	 let generator = crypto.createHash('sha1');
	 generator.update(data, 'ascii');
	 return generator.digest();
}

function and(val1, val2) {
	// for more than 32bit integers
	// obtained from http://stackoverflow.com/a/3638080
	let shift = 0, result = 0;
	let mask = ~((~0) << 30); // Gives us a bit mask like 01111..1 (30 ones)
	let divisor = 1 << 30; // To work with the bit mask, we need to clear bits at a time
	while( (val1 !== 0) && (val2 !== 0) ) {
		let rs = (mask & val1) & (mask & val2);
		val1 = Math.floor(val1 / divisor); // val1 >>> 30
		val2 = Math.floor(val2 / divisor); // val2 >>> 30
		for(let i = shift++; i--;) {
			rs *= divisor; // rs << 30
		}
		result += rs;
	}
	return result;
}

// from https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript#comment21159788_2998822
function pad(num, size){ return ('000000000' + num).substr(-size); }


global.Utils = module.exports = {
	// Basic utility functions
	toId(text) {
		return text.toLowerCase().replace(/[^a-z0-9]/g, '');
	},

	sanitize(text) {
		return ('' + text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
	},

	abbreviate(text) {
		return text.split(' ').map(str => str[0]).join('');
	},

	// From https://github.com/Daplie/knuth-shuffle
	shuffle(array) {
		let currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	// FC validation

	toFc(text) {
		if (!FC_REGEX.test(text.trim())) return false;
		text = toId(text);
		return `${text.substr(0, 4)}-${text.substr(4, 4)}-${text.substr(8, 4)}`;
	},

	validateFc(cleanedfc) {
		let fc = parseInt(cleanedfc.replace(/-/g, ''));
		if (fc > 0x7FFFFFFFFF) {
			return false;
		}
		let principalId = and(fc, 0xFFFFFFFF);
		let checksum = and(fc, 0xFF00000000)/4294967296;
		let bytes = pad((principalId).toString(16), 8);
		let a = bytes.match(/../g);
		a.reverse();
		let b = a.map(x => String.fromCharCode(parseInt(x, 16)));
		let binPrincipalId = b.join("");

		return (sha1bin(binPrincipalId)[0] >> 1) === checksum;
	},
};

global.toId = Utils.toId;
