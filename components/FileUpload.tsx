
import React, { useRef, useState } from 'react';

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                await onUpload(file);
            } else {
                alert('只支持图片文件');
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onUpload(file);
            // 重置 input 以允许再次选择同一文件
            e.target.value = '';
        }
    };

    return (
        <div
            className={`
        relative border-2 border-dashed rounded-xl p-8
        transition-all cursor-pointer
        ${isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50'
                }
        ${isUploading ? 'opacity-60 pointer-events-none' : ''}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="flex flex-col items-center text-center">
                {isUploading ? (
                    <>
                        <div className="w-12 h-12 mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium text-gray-700">上传中...</p>
                    </>
                ) : (
                    <>
                        <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            <svg className={`w-8 h-8 ${isDragging ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-1">
                            {isDragging ? '松开以上传' : '点击或拖拽上传图片'}
                        </p>
                        <p className="text-sm text-gray-500">
                            支持 PNG, JPG, GIF, WebP, SVG（最大 10MB）
                        </p>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};
