<script lang="ts">
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';

  const mobile = writable('');
  const error = writable('');

  const handleLogin = () => {
    error.set('');
    $mobile = $mobile.trim();

    if (!$mobile.match(/^05\d{8}$/)) {
      error.set('❌ Please enter a valid 10-digit Saudi mobile number');
      return;
    }

    localStorage.setItem('loyaltyCardNumber', $mobile);
    goto('/dashboard');
  };
</script>

<style>
  .container {
    max-width: 400px;
    margin: 5rem auto;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    font-family: 'Montserrat', sans-serif;
  }

  input {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
    margin-top: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  button {
    width: 100%;
    margin-top: 1rem;
    padding: 12px;
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
  }

  .error {
    margin-top: 0.5rem;
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>

<div class="container">
  <h2>Urban Market Loyalty</h2>
  <label for="mobile">Enter Card Number</label>
  <input
    id="mobile"
    bind:value={$mobile}
    type="tel"
    placeholder="05XXXXXXXX"
    maxlength="10"
  />
  <button on:click={handleLogin}>Check</button>

  {#if $error}
    <div class="error">{$error}</div>
  {/if}
</div>
