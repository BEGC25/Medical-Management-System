import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (uploadedFiles: { url: string; name: string }[]) => void;
  buttonClassName?: string;
  children: ReactNode;
  accept?: string;
}

/**
 * A file upload component that renders as a button and provides a simple interface for
 * file selection and upload.
 * 
 * Features:
 * - Renders as a customizable button that opens a file picker
 * - Provides preview for selected files
 * - Shows upload progress
 * - Handles multiple file uploads
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.accept - File types to accept (e.g., "image/*")
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  accept,
}: ObjectUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file count
    if (files.length > maxNumberOfFiles) {
      alert(`Maximum ${maxNumberOfFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert(`Files too large. Maximum size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setSelectedFiles(files);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { url } = await onGetUploadParameters();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(url);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const url = await uploadFile(file);
        return { url, name: file.name };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      if (onComplete) {
        onComplete(uploadedFiles);
      }

      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => document.getElementById('file-input')?.click()}
          className={buttonClassName}
          type="button"
        >
          {children}
        </Button>
        
        {selectedFiles.length > 0 && (
          <Button 
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        multiple={maxNumberOfFiles > 1}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <Image className="w-4 h-4" />
              <span className="flex-1 text-sm">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              {uploadProgress[file.name] && (
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[file.name]}%` }}
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}