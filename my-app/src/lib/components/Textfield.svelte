<script>
	export let name = '';
	export let placeholder = '';
    export let size = 'md';
    export let value = '';
    export let id = '';
</script>

<input name={name} id={id} bind:value placeholder={placeholder} type="text" class={`text-white focus:outline-none pl-7 border-blue-500 shadow-lg shadow-blue-500/50 transition duration-300 ease-in-out border-4 rounded-full ${size === 'sm' ? 'w-56 h-9' : size === 'md' ? 'w-96 h-12' : 'w-3xl h-16 text-3xl'}`} />
