<template>
	<div id="app">
		<div id="left">
		</div>
		<div id="center">
			<header>
				<h1>Online ABI decoder</h1>
			</header>
			<router-view id="content"/>
			<footer>
				Made by @DestinerX. MIT.
			</footer>
		</div>
		<div id="right">
		</div>
	</div>
</template>

<script>
	export default {
	}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Roboto');

/*==================================================
  Basics
  ==================================================*/

body
{
	font-family: 'Roboto', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
	font-size: 18px;
}

footer
{
	margin-top: 24px;
}

#content
{
	min-height: 78vh;
}

#app
{
	display: flex;
}

#left,
#right
{
	flex: 1;
}

#center
{
	flex: 3;
}
</style>
