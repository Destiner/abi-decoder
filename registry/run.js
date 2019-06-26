const solc = require('solc');
const keccak256 = require('js-sha3').keccak256;

const fs = require('fs');
const util = require('util');

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const contractDirPath = 'registry/contracts/';
const abiDirPath = 'registry/abi/';

async function run() {
	// const contractNames = await readDir(contractDirPath);
	// for (const contractName of contractNames) {
	// 	const contractFilePath = contractDirPath + contractName;
	// 	const contractSource = await readFile(contractFilePath, 'utf-8');
	// 	await compileContract(contractName, contractSource);
	// }
	const registry = {};
	const contractNames = await readDir(abiDirPath);
	for (const contractName of contractNames) {
		const abiFilePath = abiDirPath + contractName;
		const dappName = contractName.split('.')[0];
		const contractAbi = await readFile(abiFilePath, 'utf-8');
		const inputs = getInputs(contractAbi);
		const signatures = getSignatures(inputs);
		for (const hash in signatures) {
			const signature = signatures[hash];
			const record = {
				signature,
				'source': dappName,
			};
			if (!(hash in registry)) {
				registry[hash] = [];
			}
			registry[hash].push(record);
		}
	}
	console.log(JSON.stringify(registry));
}

function getInputs(abiString) {
	const inputs = {};
	const abi = JSON.parse(abiString);
	for (const entry of abi) {
		if (entry.type != 'function') {
			continue;
		}
		const name = entry.name;
		const entryInputs = entry.inputs;
		inputs[name] = entryInputs;
	}
	return inputs;
}

function getSignatures(inputs) {
	const signatures = {};
	for (const name in inputs) {
		const entryInputs = inputs[name];
		const fullSignature = _getFunctionSignature(name, entryInputs);
		removeTypeNames(entryInputs);
		const signature = _getFunctionSignature(name, entryInputs);
		const functionHash = keccak256(signature);
		const functionData = functionHash.substring(0, 8);
		signatures[functionData] = fullSignature;
	}
	return signatures;
}

function compileContract(name, source) {
	const input = {
		language: 'Solidity',
		sources: {
			name: {
				content: source,
			},
		},
		settings: {
			outputSelection: {
				'*': {
					'*': [ '*' ],
				},
			},
		},
	};

	const output = JSON.parse(solc.compile(JSON.stringify(input)))

	console.log(output);

	// `output` here contains the JSON output as specified in the documentation
	for (var contractName in output.contracts.name) {
		console.log(contractName + ': ' + JSON.stringify(output.contracts.name[contractName].abi));
		return output.contracts.name[contractName].abi;
	}
}

function removeTypeNames(inputs) {
	// console.log(inputs);
	for (const input of inputs) {
		if (input.type == 'tuple') {
			removeTypeNames(input.components);
		}
		if (input.type == 'tuple[]') {
			removeTypeNames(input.components);
		}
		delete input['name'];
	}
}

function _getFunctionSignature(name, inputs) {
	const types = [];
	for (const input of inputs) {
		if (input.type == 'tuple') {
			const innerSignature = _getFunctionSignature('', input.components);
			const tupleString = input.name
				? `${innerSignature} ${input.name}`
				: innerSignature;
			types.push(tupleString);
			continue;
		}
		if (input.type == 'tuple[]') {
			const tupleString = _getFunctionSignature('', input.components);
			const arrayString = input.name
				? `${tupleString}[] ${input.name}`
				: `${tupleString}[]`;
			types.push(arrayString);
			continue;
		}
		const typeString = input.name
			? `${input.type} ${input.name}`
			: input.type;
		types.push(typeString);
	}
	const typeString = types.join(',');
	const functionSignature = `${name}(${typeString})`;
	return functionSignature;
}

run();
