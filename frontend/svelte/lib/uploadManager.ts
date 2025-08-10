/// <reference types="@sveltejs/kit" />
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface UploadJob {
    id: string;
    fileName: string;
    status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: {
        processed: number;
        total: number;
        failed: number;
        skipped: number;
    };
    error_msg?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    branchId: string;
}

export interface TransactionRecord {
    customer_mobile: string;
    amount: number;
    transaction_id?: string;
    date?: string;
    notes?: string;
}

class UploadManager {
    public activeUploads = writable<Record<string, UploadJob>>({});
    public completedUploads = writable<UploadJob[]>([]);
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor() {
        if (browser) {
            this.restoreUploads();
            this.startStatusPolling();
        }
    }

    async startUpload(file: File, branchId: string, transactions: TransactionRecord[]): Promise<string> {
        const response = await fetch('/api/uploads/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add auth header if you have authentication
                // 'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                branch_id: branchId,
                file_name: file.name,
                transactions: transactions
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to queue upload');
        }

        const result = await response.json();
        const uploadId = result.job_id;

        // Add to active uploads
        const newJob: UploadJob = {
            id: uploadId,
            fileName: file.name,
            status: 'queued',
            progress: { processed: 0, total: transactions.length, failed: 0, skipped: 0 },
            created_at: new Date().toISOString(),
            branchId: branchId
        };

        this.activeUploads.update(uploads => ({
            ...uploads,
            [uploadId]: newJob
        }));

        this.saveToStorage();
        
        console.log(`✅ Upload queued: ${file.name} (${uploadId}) with ${transactions.length} transactions`);
        return uploadId;
    }

    async getUploadStatus(uploadId: string): Promise<UploadJob | null> {
        try {
            const response = await fetch(`/api/uploads/status/${uploadId}`, {
                headers: {
                    // Add auth header if needed
                    // 'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting status for upload ${uploadId}:`, error);
            return null;
        }
    }

    async getUserJobs(): Promise<UploadJob[]> {
        try {
            const response = await fetch('/api/uploads/jobs', {
                headers: {
                    // Add auth header if needed
                    // 'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                return [];
            }

            const result = await response.json();
            return result.jobs || [];
        } catch (error) {
            console.error('Error getting user jobs:', error);
            return [];
        }
    }

    async cancelJob(uploadId: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/uploads/cancel/${uploadId}`, {
                method: 'DELETE',
                headers: {
                    // Add auth header if needed
                    // 'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (response.ok) {
                // Remove from active uploads
                this.activeUploads.update(uploads => {
                    const { [uploadId]: removed, ...remaining } = uploads;
                    return remaining;
                });
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error cancelling upload ${uploadId}:`, error);
            return false;
        }
    }

    private startStatusPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(async () => {
            const activeUploads = get(this.activeUploads);
            const uploadIds = Object.keys(activeUploads);

            if (uploadIds.length === 0) {
                return;
            }

            // Poll status for each active upload
            for (const uploadId of uploadIds) {
                const status = await this.getUploadStatus(uploadId);
                if (status) {
                    this.updateUploadStatus(uploadId, status);
                }
            }
        }, 3000); // Poll every 3 seconds
    }

    private updateUploadStatus(uploadId: string, status: UploadJob) {
        this.activeUploads.update(uploads => {
            // If completed or failed, move to completed uploads
            if (status.status === 'completed' || status.status === 'failed') {
                this.completedUploads.update(list => {
                    // Check if already in completed list
                    const existingIndex = list.findIndex(job => job.id === uploadId);
                    if (existingIndex >= 0) {
                        list[existingIndex] = status;
                    } else {
                        list.unshift(status); // Add to beginning
                    }
                    return list.slice(0, 50); // Keep only latest 50
                });

                // Remove from active uploads
                const { [uploadId]: removed, ...remaining } = uploads;
                return remaining;
            } else {
                // Update active upload
                return {
                    ...uploads,
                    [uploadId]: status
                };
            }
        });

        this.saveToStorage();
    }

    private saveToStorage() {
        if (!browser) return;

        try {
            const active = get(this.activeUploads);
            const completed = get(this.completedUploads);
            
            localStorage.setItem('loyalty_active_uploads', JSON.stringify(active));
            localStorage.setItem('loyalty_completed_uploads', JSON.stringify(completed));
        } catch (error) {
            console.error('Error saving uploads to storage:', error);
        }
    }

    private restoreUploads() {
        if (!browser) return;

        try {
            const activeStr = localStorage.getItem('loyalty_active_uploads');
            const completedStr = localStorage.getItem('loyalty_completed_uploads');

            if (activeStr) {
                const active = JSON.parse(activeStr);
                this.activeUploads.set(active);
            }

            if (completedStr) {
                const completed = JSON.parse(completedStr);
                this.completedUploads.set(completed);
            }
        } catch (error) {
            console.error('Error restoring uploads from storage:', error);
            // Clear corrupted data
            localStorage.removeItem('loyalty_active_uploads');
            localStorage.removeItem('loyalty_completed_uploads');
        }
    }

    public getProgressPercentage(job: UploadJob): number {
        if (job.progress.total === 0) return 0;
        return Math.round((job.progress.processed / job.progress.total) * 100);
    }

    public getStatusIcon(status: UploadJob['status']): string {
        switch (status) {
            case 'queued': return '⏳';
            case 'pending': return '⏳';
            case 'processing': return '⚙️';
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'cancelled': return '⏹️';
            default: return '❓';
        }
    }

    public getStatusColor(status: UploadJob['status']): string {
        switch (status) {
            case 'queued': return 'text-yellow-600';
            case 'pending': return 'text-yellow-600';
            case 'processing': return 'text-blue-600';
            case 'completed': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'cancelled': return 'text-gray-600';
            default: return 'text-gray-500';
        }
    }

    public destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
}

export const uploadManager = new UploadManager();
