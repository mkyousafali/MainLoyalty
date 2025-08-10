<script lang="ts">
  import { onMount } from 'svelte';

  interface ExportData {
    id: string;
    name: string;
    description: string;
    type: 'customers' | 'transactions' | 'analytics' | 'rewards';
    format: 'csv' | 'excel' | 'pdf';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    fileSize?: string;
    recordCount?: number;
    createdDate: string;
    completedDate?: string;
  }

  let exports: ExportData[] = [];
  let isLoading = false;
  let showCreateModal = false;

  // Form data
  let exportForm = {
    name: '',
    description: '',
    type: 'customers' as const,
    format: 'csv' as const,
    dateFrom: '',
    dateTo: '',
    includeInactive: false
  };

  const exportTypes = [
    { value: 'customers', label: 'Customer Data', description: 'Export customer information and statistics' },
    { value: 'transactions', label: 'Transaction Data', description: 'Export transaction history and details' },
    { value: 'analytics', label: 'Analytics Report', description: 'Export analytics and performance data' },
    { value: 'rewards', label: 'Rewards Data', description: 'Export rewards and redemption data' }
  ];

  const formatTypes = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values file' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel spreadsheet' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format report' }
  ];

  onMount(() => {
    loadExports();
  });

  function loadExports() {
    isLoading = true;
    setTimeout(() => {
      exports = [
        {
          id: '1',
          name: 'All Customers Export',
          description: 'Complete customer database export',
          type: 'customers',
          format: 'excel',
          status: 'completed',
          downloadUrl: '#',
          fileSize: '2.5 MB',
          recordCount: 2847,
          createdDate: '2024-01-10',
          completedDate: '2024-01-10'
        },
        {
          id: '2',
          name: 'January Transactions',
          description: 'All transactions for January 2024',
          type: 'transactions',
          format: 'csv',
          status: 'processing',
          recordCount: 15634,
          createdDate: '2024-01-15'
        },
        {
          id: '3',
          name: 'Analytics Report Q1',
          description: 'Quarterly analytics and performance report',
          type: 'analytics',
          format: 'pdf',
          status: 'failed',
          createdDate: '2024-01-12'
        }
      ];
      isLoading = false;
    }, 1000);
  }

  function openCreateModal() {
    exportForm = {
      name: '',
      description: '',
      type: 'customers',
      format: 'csv',
      dateFrom: '',
      dateTo: '',
      includeInactive: false
    };
    showCreateModal = true;
  }

  function createExport() {
    const newExport: ExportData = {
      id: Date.now().toString(),
      name: exportForm.name,
      description: exportForm.description,
      type: exportForm.type,
      format: exportForm.format,
      status: 'pending',
      recordCount: Math.floor(Math.random() * 10000) + 1000,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    exports = [newExport, ...exports];
    showCreateModal = false;
    
    // Simulate processing
    setTimeout(() => {
      const index = exports.findIndex(e => e.id === newExport.id);
      if (index !== -1) {
        exports[index].status = 'processing';
        exports = [...exports];
        
        // Simulate completion
        setTimeout(() => {
          const completedIndex = exports.findIndex(e => e.id === newExport.id);
          if (completedIndex !== -1) {
            exports[completedIndex] = {
              ...exports[completedIndex],
              status: 'completed',
              downloadUrl: '#',
              fileSize: (Math.random() * 10 + 0.5).toFixed(1) + ' MB',
              completedDate: new Date().toISOString().split('T')[0]
            };
            exports = [...exports];
          }
        }, 3000);
      }
    }, 1000);
  }

  function deleteExport(id: string) {
    if (confirm('Are you sure you want to delete this export?')) {
      exports = exports.filter(e => e.id !== id);
    }
  }

  function retryExport(exportData: ExportData) {
    const index = exports.findIndex(e => e.id === exportData.id);
    if (index !== -1) {
      exports[index].status = 'pending';
      exports = [...exports];
      
      // Simulate retry process
      setTimeout(() => {
        const retryIndex = exports.findIndex(e => e.id === exportData.id);
        if (retryIndex !== -1) {
          exports[retryIndex].status = 'processing';
          exports = [...exports];
        }
      }, 1000);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'customers': return '👥';
      case 'transactions': return '💳';
      case 'analytics': return '📊';
      case 'rewards': return '🎁';
      default: return '📄';
    }
  }

  function getFormatIcon(format: string) {
    switch (format) {
      case 'csv': return '📝';
      case 'excel': return '📗';
      case 'pdf': return '📄';
      default: return '📁';
    }
  }
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Export Data</h1>
      <p class="text-gray-600">Export and download data in various formats</p>
    </div>
    <button 
      on:click={openCreateModal}
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
    >
      <span class="mr-2">📤</span>
      Create Export
    </button>
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Quick Export Options -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {#each exportTypes as type}
        <div class="bg-white rounded-lg shadow p-6 border hover:border-blue-300 cursor-pointer transition-colors">
          <div class="flex items-center mb-3">
            <span class="text-2xl mr-3">{getTypeIcon(type.value)}</span>
            <h3 class="text-lg font-semibold text-gray-900">{type.label}</h3>
          </div>
          <p class="text-gray-600 text-sm mb-4">{type.description}</p>
          <button 
            on:click={() => {
              exportForm.type = type.value;
              exportForm.name = `${type.label} Export`;
              exportForm.description = type.description;
              showCreateModal = true;
            }}
            class="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium"
          >
            Quick Export
          </button>
        </div>
      {/each}
    </div>

    <!-- Exports History -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Export History</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Export</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each exports as exportData}
              <tr>
                <td class="px-6 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{exportData.name}</div>
                    <div class="text-sm text-gray-500">{exportData.description}</div>
                    {#if exportData.fileSize}
                      <div class="text-xs text-gray-400 mt-1">Size: {exportData.fileSize}</div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-lg mr-2">{getTypeIcon(exportData.type)}</span>
                    <span class="text-sm text-gray-900 capitalize">{exportData.type}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-lg mr-2">{getFormatIcon(exportData.format)}</span>
                    <span class="text-sm text-gray-900 uppercase">{exportData.format}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {exportData.recordCount?.toLocaleString() || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(exportData.status)}">
                      {exportData.status}
                    </span>
                    {#if exportData.status === 'processing'}
                      <div class="text-xs text-gray-500 mt-1">
                        <div class="w-full bg-gray-200 rounded-full h-1">
                          <div class="bg-blue-600 h-1 rounded-full animate-pulse" style="width: 45%"></div>
                        </div>
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    {new Date(exportData.createdDate).toLocaleDateString()}
                    {#if exportData.completedDate}
                      <div class="text-xs text-gray-500">
                        Completed: {new Date(exportData.completedDate).toLocaleDateString()}
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    {#if exportData.status === 'completed' && exportData.downloadUrl}
                      <a 
                        href={exportData.downloadUrl}
                        download
                        class="text-green-600 hover:text-green-900"
                      >
                        Download
                      </a>
                    {:else if exportData.status === 'failed'}
                      <button 
                        on:click={() => retryExport(exportData)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        Retry
                      </button>
                    {/if}
                    <button 
                      on:click={() => deleteExport(exportData.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Export Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 text-sm font-semibold">📊</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Exports</p>
            <p class="text-lg font-semibold text-gray-900">{exports.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-green-600 text-sm font-semibold">✅</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Completed</p>
            <p class="text-lg font-semibold text-gray-900">
              {exports.filter(e => e.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-yellow-600 text-sm font-semibold">⏳</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Processing</p>
            <p class="text-lg font-semibold text-gray-900">
              {exports.filter(e => e.status === 'processing' || e.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-red-600 text-sm font-semibold">❌</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Failed</p>
            <p class="text-lg font-semibold text-gray-900">
              {exports.filter(e => e.status === 'failed').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Create Export Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Export</h3>
        
        <form on:submit|preventDefault={createExport} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Export Name</label>
            <input 
              type="text" 
              bind:value={exportForm.name}
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              bind:value={exportForm.description}
              rows="2"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
            <select 
              bind:value={exportForm.type}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {#each exportTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select 
              bind:value={exportForm.format}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {#each formatTypes as format}
                <option value={format.value}>{format.label}</option>
              {/each}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input 
                type="date" 
                bind:value={exportForm.dateFrom}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input 
                type="date" 
                bind:value={exportForm.dateTo}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="flex items-center">
              <input 
                type="checkbox" 
                bind:checked={exportForm.includeInactive}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Include inactive records</span>
            </label>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              on:click={() => showCreateModal = false}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Export
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
