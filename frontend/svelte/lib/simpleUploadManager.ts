import { writable } from 'svelte/store';

export interface UploadStatus {
  id: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: {
    processed: number;
    total: number;
    failed: number;
  };
  created_at: string;
  error_msg?: string;
}

class SimpleUploadManager {
  public activeUploads = writable<UploadStatus[]>([]);
  public completedUploads = writable<UploadStatus[]>([]);

  async submitUpload(file: File, branchId: string): Promise<string> {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newUpload: UploadStatus = {
      id: uploadId,
      fileName: file.name,
      status: 'uploading',
      progress: { processed: 0, total: 100, failed: 0 },
      created_at: new Date().toISOString()
    };

    // Add to active uploads
    this.activeUploads.update(uploads => [...uploads, newUpload]);
    
    return uploadId;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'uploading': return '⬆️';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  }
}

export const uploadManager = new SimpleUploadManager();
