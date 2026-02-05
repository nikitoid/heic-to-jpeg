export interface ConvertedImage {
    id: string
    file: File
    originalName: string
    originalSize: number
    status: 'pending' | 'processing' | 'done' | 'error'
    url?: string
    blob?: Blob
    convertedSize?: number
}
