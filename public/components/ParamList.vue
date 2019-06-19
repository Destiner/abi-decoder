<template>
	<div class="list">
		<div v-for="key in keys">
			<div class="param">
				<span class="param-type">{{ getType(key) }}</span>
				<span class="param-name">{{ key }}: </span>
				<span v-if="isNested(params[key])">
					<param-list :params="params[key]" :inputs="getInputs(key)"/>
				</span>
				<span v-else>
					{{ params[key] }}
				</span>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "param-list",
	props: ['params', 'inputs'],
	methods: {
		isNested(param) {
			return Array.isArray(param);
		},
		getInputs(key) {
			if (this.inputs.type == 'tuple[]') {
				return this.inputs.components;
			}
			const keyIndex = this.keys.indexOf(key);
			return this.inputs[keyIndex];
		},
		getType(key) {
			const type = this.inputs.type;
			if (type == 'tuple') {
				// Tuple
				const keyIndex = this.keys.indexOf(key);
				return this.inputs.components[keyIndex].type;
			}
			if (type && type.slice(-2) == '[]') {
				// Array
				return type.slice(0, -2);
			}
			const keyIndex = this.keys.indexOf(key);
			return this.inputs[keyIndex].type;
		}
	},
	computed: {
		keys() {
			const allKeys = Object.keys(this.params);
			const isArray = ((allKeys.length - 1) in this.params)
			const keyCount = isArray
				? allKeys.length
				: allKeys.length / 2;
			const startIndex = isArray
				? 0
				: keyCount;
			const endIndex = allKeys.length;
			const keys = [];
			for (let i = startIndex; i < endIndex; i++) {
				const key = allKeys[i];
				keys.push(key);
			}
			return keys;
		},
	},
}
</script>

<style scoped>
.list
{
	margin-left: 10px;
}

.param
{
	white-space: nowrap;
	max-width: 800px; 
	overflow: hidden;
	text-overflow: ellipsis;
}

.param-type
{
	font-size: 12px;
	font-style: italic;
	color: gray;
}

.param-name
{
	margin-left: 8px;
}
</style>
