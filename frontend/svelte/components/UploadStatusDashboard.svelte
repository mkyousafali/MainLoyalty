<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { uploadManager, type UploadJob, type UploadProgress } from '$lib/uploadManager';

    let activeUploads: Record<string, UploadProgress> = {};
    let completedUploads: UploadJob[] = [];
    
    let unsubscribeActive: (() => void) | undefined;
    let unsubscribeCompleted: (() => void) | undefined;

    onMount(() => {
        // Subscribe to upload stores
        unsubscribeActive = uploadManager.activeUploadsStore.subscribe(uploads => {
            activeUploads = Object.fromEntries(uploads);
        });
        
        unsubscribeCompleted = uploadManager.completedUploadsStore.subscribe(uploads => {
            completedUploads = uploads;
        });
    });

    onDestroy(() => {
        if (unsubscribeActive) unsubscribeActive();
        if (unsubscribeCompleted) unsubscribeCompleted();
        uploadManager.destroy();
    });

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString();
    }

    function formatDuration(startStr?: string, endStr?: string): string {
        if (!startStr || !endStr) return '';
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diff = end.getTime() - start.getTime();
        const seconds = Math.round(diff / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    }

    async function cancelUpload(uploadId: string) {
        const success = await uploadManager.cancelJob(uploadId);
        if (!success) {
            alert('Failed to cancel upload');
        }
    }

    function getProgressBarColor(status: UploadProgress['status'] | UploadJob['status']): string {
        switch (status) {
            case 'processing': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            case 'paused': return 'bg-yellow-500';
            case 'cancelled': return 'bg-gray-500';
            default: return 'bg-yellow-500';
        }
    }
</script>

<div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Upload Status Dashboard</h1>
        <p class="text-gray-600">Monitor your transaction upload progress in real-time</p>
    </div>

    <!-- Active Uploads -->
    {#if Object.keys(activeUploads).length > 0}
        <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                Active Uploads ({Object.keys(activeUploads).length})
            </h2>
            
            <div class="space-y-4">
                {#each Object.values(activeUploads) as upload (upload.jobId)}
                    <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <span class="text-2xl">{uploadManager.getStatusIcon(upload.status)}</span>
                                <div>
                                    <h3 class="font-medium text-gray-900">{upload.fileName}</h3>
                                    <p class="text-sm text-gray-500">Job ID: {upload.jobId}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-3">
                                <span class="px-3 py-1 rounded-full text-sm font-medium {uploadManager.getStatusColor(upload.status)} bg-gray-100">
                                    {upload.status.toUpperCase()}
                                </span>
                                
                                {#if upload.status === 'pending'}
                                    <button 
                                        on:click={() => cancelUpload(upload.jobId)}
                                        class="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="mb-3">
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress: {upload.progress.processed} / {upload.progress.total}</span>
                                <span>{uploadManager.getProgressPercentage(upload)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(upload.status)}"
                                    style="width: {uploadManager.getProgressPercentage(upload)}%"
                                ></div>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="flex space-x-6 text-sm text-gray-600">
                            <span>✅ Processed: {upload.progress.processed}</span>
                            {#if upload.progress.failed > 0}
                                <span class="text-red-600">❌ Failed: {upload.progress.failed}</span>
                            {/if}
                        </div>

                        {#if upload.error}
                            <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p class="text-sm text-red-700">{upload.error}</p>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div class="mb-8 text-center py-8">
            <div class="text-gray-400 text-6xl mb-4">📋</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Uploads</h3>
            <p class="text-gray-600">Upload some transaction files to see progress here</p>
        </div>
    {/if}

    <!-- Completed Uploads -->
    {#if completedUploads.length > 0}
        <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span class="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                Recent Uploads ({completedUploads.length})
            </h2>
            
            <div class="bg-white rounded-lg shadow-md border border-gray-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    File
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Progress
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completed
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each completedUploads as upload (upload.id)}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <span class="text-lg mr-2">{uploadManager.getStatusIcon(upload.status)}</span>
                                            <div>
                                                <div class="text-sm font-medium text-gray-900">{upload.fileName}</div>
                                                <div class="text-sm text-gray-500">{upload.progress.total} transactions</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {upload.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            {upload.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div class="flex items-center">
                                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div 
                                                    class="h-2 rounded-full {upload.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}"
                                                    style="width: {uploadManager.getProgressPercentage(upload)}%"
                                                ></div>
                                            </div>
                                            <span>{upload.progress.processed}/{upload.progress.total}</span>
                                            {#if upload.progress.failed > 0}
                                                <span class="ml-2 text-red-600 text-xs">({upload.progress.failed} failed)</span>
                                            {/if}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDuration(upload.started_at, upload.completed_at)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {upload.completed_at ? formatDate(upload.completed_at) : ''}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Custom animations for progress bars */
    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: .5;
        }
    }
</style>
