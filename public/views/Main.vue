<template>
	<div>
		<div id="data">
			<input placeholder="Enter tx data (0x…)" v-model="data" :class="{ error: error }">
			<div id="error-name" v-if="error">{{ error }}</div>
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
			error: '',
			name: '',
			params: [],
			inputs: [],
		}
	},
	watch: {
		data: async function (newData) {
			this.clear();
			if (newData.length == 0) {
				this.error = '';
				return;
			}
			if (newData.length < 10) {
				this.error = 'A signature should be at least 10 chars long';
				return;
			}
			if (!ethers.utils.isHexString(newData)) {
				this.error = 'Not a valid hex string';
				return;
			}
			const signature = await this.getSignature(newData);
			if (!signature || signature == '') {
				this.error = 'Signature not found';
				return;
			}
			this.name = this.getName(signature);
			const params = this.getParams(signature);
			if (!params) {
				this.error = 'Can\'t decode: insufficient data';
				return;
			}
			this.params = params;
		},
	},
	methods: {
		getInputs(inputString) {
			const indexStack = [];
			const tokenStack = [];
			let index = 0;
			let innerInputs = [];
			for (let i = 0; i < inputString.length; i++) {
				const char = inputString.charAt(i);
				switch (char) {
					case '(': {
						// acc
						const tokens = [];
						tokenStack.push(tokens);
						index = i + 1;
						break;
					}
					case ')': {
						// fold
						const tokens = tokenStack.pop();
						const input = this.getInput(innerInputs, inputString, index, i);
						tokens.push(input);
						index = i + 1;
						innerInputs = tokens;
						break;
					}
					case ',': {
						// token
						const tokens = tokenStack.length == 0
							? []
							: tokenStack.pop();
						const input = this.getInput(innerInputs, inputString, index, i);
						innerInputs = [];
						tokens.push(input);
						tokenStack.push(tokens);
						index = i + 1;
						break;
					}
				}
			}
			// token
			const tokens = tokenStack.length == 0
				? []
				: tokenStack.pop();
			const input = this.getInput(innerInputs, inputString, index);
			tokens.push(input);
			tokenStack.push(tokens);
			const inputs = tokenStack.pop();
			return inputs;
		},
		getInput(innerInputs, fullInputString, start, end) {
			const inputString = fullInputString.slice(start, end);
			if (innerInputs.length == 0) {
				// Simple input
				const tokens = inputString.split(' ');
				const type = tokens[0];
				const name = tokens[1];
				const input = {
					type,
					name,
				}
				return input;
			} else {
				// Tuple input
				const tokens = inputString.split(' ');
				const input = {};
				if (tokens.length == 2) {
					input.name = tokens[1];
				}
				input.type = tokens[0] == ''
					? 'tuple'
					: 'tuple[]';
				input.components = innerInputs;
				return input;
			}
		},
		clear() {
			this.error = '';
			this.name = '';
			this.params = [];
		},
		async getSignature(data) {
			if (data == '') {
				return '';
			}
			const hash = data.slice(2, 10);
			// Query local signatures
			if (hash in signatures) {
				return signatures[hash][0].signature;
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
			return json.results[0].text_signature;
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
			try {
				const decodedParams = abiCoder.decode(this.inputs, data);
				return decodedParams;
			} catch(e) {
				return;
			}
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
	width: 500px;
}

input.error
{
	border-bottom: 1px solid red;
}

#error-name
{
	margin-top: 8px;
	font-size: 0.75em;
	color: red;
}

div#data
{
	display: flex;
	align-items: center;
	flex-direction: column;
}

.decoded
{
	margin-top: 20px;
}
</style>
