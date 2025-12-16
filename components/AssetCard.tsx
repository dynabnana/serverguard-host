
import React, { useRef } from 'react';
import { HostedAsset } from '../types';

interface AssetCardProps {
  asset: HostedAsset;
  onUpdate: (id: string, newUrl: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdate(asset.id, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      {/* Image Preview Area */}
      <div className="relative aspect-video w-full bg-gray-100 group overflow-hidden border-b border-gray-100 flex items-center justify-center">
        {/* We use an onerror handler to show a placeholder if the user hasn't uploaded the file to public/ yet */}
        <img 
          src={asset.url} 
          alt={asset.name} 
          className="w-full h-full object-contain p-4 z-10 relative"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Placeholder State */}
        <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">暂无预览</span>
            <span className="text-xs mt-1 text-gray-400">服务器 public 目录未检测到 {asset.url}</span>
        </div>

        {/* Upload Overlay (For testing/preview only) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
           <button 
             className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-gray-50 active:scale-95 transition-transform text-sm"
           >
             上传预览图 (仅本地)
           </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
            <div>
                <h3 className="font-bold text-gray-900 text-lg">{asset.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                    {asset.url}
                  </span>
                </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${asset.placeholderColor}`}></div>
        </div>
        <p className="text-gray-500 text-xs mt-2 leading-relaxed">
           {asset.description}
        </p>
      </div>
      
      {/* Hidden file input for preview */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png,image/jpeg,image/gif"
      />
    </div>
  );
};
