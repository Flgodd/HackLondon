<script lang="ts">
    export let click = () => {};
    export let submit = true;
    import { faSearch, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
    export let icon: IconDefinition = faSearch;
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    export let disabled = false;
</script>
   
<button disabled={disabled} on:click={click} type={submit ? 'submit' : 'button'} class={'rounded-md bg-blue-500 px-10 py-5 text-3xl font-semibold text-white shadow-lg shadow-blue-500/50 focus:outline-none cursor-pointer transition duration-300 ease-in-out hover:shadow-blue-600 hover:scale-105'}>
    <FontAwesomeIcon {icon} size='sm' />

    <slot></slot>
</button>