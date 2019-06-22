<template>
	<div>
		<div id="data">
			<input placeholder="Enter tx data (0x…)" v-model="data" :class="{ error: badInput }">
		</div>
		<div class="decoded">
			<div>{{ name }}</div>
			<param-list class="decoded" :params="params" :inputs="inputs" />
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers';

import ParamList from '../components/ParamList.vue';

import signatures from '../assets/signatures.json';

export default {
	components: {
		ParamList,
	},
	data() {
		return {
			data: '',
			name: '',
			params: [],
			inputs: [],
		}
	},
	watch: {
		data: async function (newData) {
			this.clear();
			if (this.badInput) {
				return;
			}
			const signature = await this.getSignature(newData);
			if (!signature || signature == '') {
				return;
			}
			this.name = this.getName(signature);
			this.params = this.getParams(signature);
		},
	},
	methods: {
		getInputs(inputString) {
			let simpleInputStartIndex = 0;
			const startIndices = [];
			const inputs = [];
			for (let i = 0; i < inputString.length; i++) {
				const char = inputString.charAt(i);
				if (char == '(') {
					if (startIndices.length == 0 && i != 0) {
						const simpleInputString = inputString.slice(simpleInputStartIndex, i - 1);
						const simpleInputs = this.getSimpleInputs(simpleInputString);
						for (const simpleInput of simpleInputs) {
							inputs.push(simpleInput);
						}
					}
					startIndices.push(i);
				}
				if (char == ')') {
					const start = startIndices.pop() + 1;
					const innerInputString = inputString.slice(start, i);
					const innerInputs = this.getInputs(innerInputString);
					let tupleTypeEndIndex;
					let input = {};
					if (inputString.charAt(i + 1) == '[' && inputString.charAt(i + 2) == ']') {
						// Tuple array
						input = {
							type: 'tuple[]',
							components: innerInputs,
						};
						tupleTypeEndIndex = i + 2;
					} else {
						// Tuple
						input = {
							type: 'tuple',
							components: innerInputs,
						};
						tupleTypeEndIndex = i;
					}
					simpleInputStartIndex = inputString.indexOf(',', tupleTypeEndIndex) + 1;
					if (simpleInputStartIndex > tupleTypeEndIndex + 2) {
						// Tuple name
						const tupleName = inputString.slice(tupleTypeEndIndex + 2, simpleInputStartIndex - 1);
						if (tupleName) {
							input.name = tupleName;
						}
					}
					inputs.push(input);
				}
			}
			const simpleInputString = inputString.slice(simpleInputStartIndex);
			const simpleInputs = this.getSimpleInputs(simpleInputString);
			for (const simpleInput of simpleInputs) {
				inputs.push(simpleInput);
			}
			return inputs;
		},
		getSimpleInputs(inputString) {
			const inputStrings = inputString.split(',');
			const inputs = [];
			for (const inputString of inputStrings) {
				const inputData = inputString.split(' ');
				const type  = inputData[0];
				const name = inputData[1];
				const input = {
					type,
				};
				if (name) {
					input.name = name;
				}
				inputs.push(input);
			}
			return inputs;
		},
		clear() {
			this.name = '';
			this.params = [];
		},
		async getSignature(data) {
			if (data == '') {
				return '';
			}
			const hash = data.slice(2, 10);
			let signature;
			// Query local signatures
			signature = signatures[hash][0].signature;
			if (signature) {
				return signature;
			}
			// Fallback: query 4byte
			const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=0x${hash}`;
			const response = await fetch(url);
			const json = await response.json();
			const count = json.count;
			if (count == 0) {
				// Not found
				return;
			}
			// Show function name
			signature = json.results[0].text_signature;
			return signature;
		},
		getName(signature) {
			const end = signature.indexOf('(');
			const name = signature.slice(0, end);
			return name;
		},
		getParams(signature) {
			const abiCoder = new ethers.utils.AbiCoder();
			const data = `0x${this.data.slice(10, this.data.length)}`;
			const inputStringStart = signature.indexOf('(') + 1;
			const inputString = signature.slice(inputStringStart, -1);
			this.inputs = this.getInputs(inputString);
			const decodedParams = abiCoder.decode(this.inputs, data);
			return decodedParams;
		},
	},
	computed: {
		badInput() {
			return this.data.length > 0 && !ethers.utils.isHexString(this.data);
		},
	},
}
</script>

<style scoped>
input
{
	font-size: 18px;
	border: 0;
	border-bottom: 1px solid black;
	min-width: 500px;
}

input.error
{
	border-bottom: 1px solid red;
}

div#data
{
	display: flex;
	justify-content: center;
}

.decoded
{
	margin-top: 20px;
}
</style>
