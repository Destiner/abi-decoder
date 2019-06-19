<template>
	<div class="list">
		<div v-for="key in keys">
			<div v-if="isNested(params[key])">
				{{ key }}: <param-list :params="params[key]" />
			</div>
			<div class="param" v-else>
				{{ key }}: {{ params[key] }}
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "param-list",
	props: ['params'],
	methods: {
		isNested(param) {
			return Array.isArray(param);
		},
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
	width: 600px; 
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
