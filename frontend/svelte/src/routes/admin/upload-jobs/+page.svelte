<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let jobs: any[] = [];
  let isLoading = true;
  let error = '';
  let selectedJob: any = null;
  let showJobDetails = false;
  let refreshInterval: any;

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalJobs = 0;

  // Filters
  let filterStatus = 'all'; // all, pending, processing, completed, failed
  let filterDateRange = 'all'; // all, today, week, month

  onMount(() => {
    loadJobs();
    // Auto-refresh every 5 seconds
    refreshInterval = setInterval(loadJobs, 5000);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  async function loadJobs() {
    try {
      isLoading = true;
      error = '';

      let query = supabase
        .from('upload_jobs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply date filter
      if (filterDateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filterDateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: jobError, count } = await query;

      if (jobError) {
        console.error('Error loading jobs:', jobError);
        error = `Failed to load jobs: ${jobError.message}`;
        return;
      }

      jobs = data || [];
      totalJobs = count || 0;
      console.log(`Loaded ${jobs.length} jobs from database`);

    } catch (err: any) {
      console.error('Error in loadJobs:', err);
      error = `Unexpected error: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function viewJobDetails(job: any) {
    selectedJob = job;
    showJobDetails = true;
  }

  async function deleteJob(jobId: string) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('upload_jobs')
        .delete()
        .eq('id', jobId);

      if (deleteError) {
        alert(`Failed to delete job: ${deleteError.message}`);
        return;
      }

      // Reload jobs
      await loadJobs();
      alert('Job deleted successfully');
    } catch (err: any) {
      alert(`Error deleting job: ${err.message}`);
    }
  }

  async function retryJob(jobId: string) {
    try {
      const { error: updateError } = await supabase
        .from('upload_jobs')
        .update({ 
          status: 'pending', 
          error_msg: null,
          retry_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        alert(`Failed to retry job: ${updateError.message}`);
        return;
      }

      await loadJobs();
      alert('Job queued for retry');
    } catch (err: any) {
      alert(`Error retrying job: ${err.message}`);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Pagination functions
  $: totalPages = Math.ceil(totalJobs / itemsPerPage);
  $: hasNextPage = currentPage < totalPages;
  $: hasPrevPage = currentPage > 1;

  function nextPage() {
    if (hasNextPage) {
      currentPage++;
      loadJobs();
    }
  }

  function prevPage() {
    if (hasPrevPage) {
      currentPage--;
      loadJobs();
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadJobs();
    }
  }

  // Filter change handlers
  $: if (filterStatus || filterDateRange) {
    currentPage = 1;
    loadJobs();
  }
</script>

<svelte:head>
  <title>Upload Jobs - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
  <div class="p-6 max-w-7xl mx-auto">
    
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Upload Jobs Management</h1>
        <p class="text-gray-600 mt-2">Monitor and manage all transaction upload jobs</p>
      </div>
      <div class="flex gap-3">
        <button
          on:click={() => goto('/admin/upload-transactions')}
          class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <span>←</span>
          Back to Upload
        </button>
        <button
          on:click={loadJobs}
          disabled={isLoading}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <span class:animate-spin={isLoading}>🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select bind:value={filterStatus} class="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select bind:value={filterDateRange} class="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        <div class="flex items-end">
          <div class="text-sm text-gray-600">
            Total: <span class="font-semibold">{totalJobs}</span> jobs
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <span class="text-red-500 mr-2">⚠️</span>
          <p class="text-red-700">{error}</p>
        </div>
      </div>
    {/if}

    <!-- Jobs Table -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      {#if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading jobs...</p>
        </div>
      {:else if jobs.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📋</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
          <p class="text-gray-600">No upload jobs match your current filters.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each jobs as job (job.id)}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {job.id.substring(0, 8)}...
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{job.file_name || 'N/A'}</div>
                    {#if job.file_size}
                      <div class="text-xs text-gray-500">{formatFileSize(job.file_size)}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.branch_name || job.branch_id || 'N/A'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(job.status)}">
                      {job.status || 'unknown'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-1">
                        {#if job.total_rows > 0}
                          <div class="text-sm text-gray-900">
                            {job.processed_rows || 0} / {job.total_rows}
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              class="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style="width: {((job.processed_rows || 0) / job.total_rows) * 100}%"
                            ></div>
                          </div>
                        {:else}
                          <span class="text-sm text-gray-500">No data</span>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.created_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      on:click={() => viewJobDetails(job)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                    {#if job.status === 'failed'}
                      <button
                        on:click={() => retryJob(job.id)}
                        class="text-green-600 hover:text-green-900"
                      >
                        Retry
                      </button>
                    {/if}
                    <button
                      on:click={() => deleteJob(job.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                on:click={prevPage}
                disabled={!hasPrevPage}
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                on:click={nextPage}
                disabled={!hasNextPage}
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing
                  <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  to
                  <span class="font-medium">{Math.min(currentPage * itemsPerPage, totalJobs)}</span>
                  of
                  <span class="font-medium">{totalJobs}</span>
                  results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    on:click={prevPage}
                    disabled={!hasPrevPage}
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  {#each Array(Math.min(totalPages, 7)) as _, i}
                    {@const page = i + 1}
                    <button
                      on:click={() => goToPage(page)}
                      class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {currentPage === page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                    >
                      {page}
                    </button>
                  {/each}
                  <button
                    on:click={nextPage}
                    disabled={!hasNextPage}
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Job Details Modal -->
{#if showJobDetails && selectedJob}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Job Details</h2>
          <button
            on:click={() => showJobDetails = false}
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Job ID</label>
              <p class="mt-1 text-sm text-gray-900 font-mono">{selectedJob.id}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">File Name</label>
              <p class="mt-1 text-sm text-gray-900">{selectedJob.file_name || 'N/A'}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Branch</label>
              <p class="mt-1 text-sm text-gray-900">{selectedJob.branch_name || selectedJob.branch_id || 'N/A'}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <span class="mt-1 px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(selectedJob.status)}">
                {selectedJob.status || 'unknown'}
              </span>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Created</label>
              <p class="mt-1 text-sm text-gray-900">{formatDate(selectedJob.created_at)}</p>
            </div>

            {#if selectedJob.updated_at}
              <div>
                <label class="block text-sm font-medium text-gray-700">Updated</label>
                <p class="mt-1 text-sm text-gray-900">{formatDate(selectedJob.updated_at)}</p>
              </div>
            {/if}
          </div>

          <!-- Progress Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Progress Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Total Rows</label>
              <p class="mt-1 text-sm text-gray-900">{selectedJob.total_rows || 0}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Processed Rows</label>
              <p class="mt-1 text-sm text-gray-900">{selectedJob.processed_rows || 0}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Failed Rows</label>
              <p class="mt-1 text-sm text-gray-900">{selectedJob.failed_rows || 0}</p>
            </div>

            {#if selectedJob.total_rows > 0}
              <div>
                <label class="block text-sm font-medium text-gray-700">Progress</label>
                <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style="width: {((selectedJob.processed_rows || 0) / selectedJob.total_rows) * 100}%"
                  ></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {((selectedJob.processed_rows || 0) / selectedJob.total_rows * 100).toFixed(1)}% complete
                </p>
              </div>
            {/if}

            {#if selectedJob.file_size}
              <div>
                <label class="block text-sm font-medium text-gray-700">File Size</label>
                <p class="mt-1 text-sm text-gray-900">{formatFileSize(selectedJob.file_size)}</p>
              </div>
            {/if}

            {#if selectedJob.retry_count}
              <div>
                <label class="block text-sm font-medium text-gray-700">Retry Count</label>
                <p class="mt-1 text-sm text-gray-900">{selectedJob.retry_count}</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Error Message -->
        {#if selectedJob.error_msg}
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Error Details</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-red-800">{selectedJob.error_msg}</p>
            </div>
          </div>
        {/if}

        <!-- Job Data -->
        {#if selectedJob.job_data}
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Job Configuration</h3>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre class="text-sm text-gray-800 overflow-auto">{JSON.stringify(selectedJob.job_data, null, 2)}</pre>
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-end space-x-3">
          {#if selectedJob.status === 'failed'}
            <button
              on:click={() => retryJob(selectedJob.id)}
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Retry Job
            </button>
          {/if}
          <button
            on:click={() => deleteJob(selectedJob.id)}
            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete Job
          </button>
          <button
            on:click={() => showJobDetails = false}
            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
