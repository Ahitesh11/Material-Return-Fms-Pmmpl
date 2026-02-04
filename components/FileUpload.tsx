
import React, { useState } from 'react';
import { CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { BACKEND_URL } from '../App';

declare const google: any;

interface FileUploadProps {
  label: string;
  onUpload: (url: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setDone(false);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        // 1. Native GAS Upload
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler((url: string) => {
              onUpload(url);
              setDone(true);
              setUploading(false);
            })
            .withFailureHandler(() => {
              alert("Native upload failed.");
              setUploading(false);
            })
            .uploadToDrive(base64Data, file.name);
          return;
        }

        // 2. Remote Fallback
        try {
          // We must use GET with short names for data? No, doPost is better.
          const response = await fetch(BACKEND_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action: 'uploadToDrive', base64Data, fileName: file.name })
          });
          const resJson = await response.json();
          if (resJson.success) {
            onUpload(resJson.data);
            setDone(true);
          } else {
            throw new Error(resJson.error);
          }
        } catch (err) {
          console.error("Remote Upload Error:", err);
          alert("Image upload failed. Ensure Web App access is 'Anyone'.");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("File processing failed.");
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
      <div className={`relative border-2 border-dashed rounded-xl transition-all duration-200 min-h-[60px] flex items-center justify-center ${
        done ? 'border-green-200 bg-green-50' : 
        uploading ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
      }`}>
        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} disabled={uploading} />
        <div className="flex flex-col items-center justify-center p-2 gap-1">
          {uploading ? (
            <><Loader2 className="animate-spin text-indigo-500" size={18} /><span className="text-[9px] font-bold text-indigo-600">Uploading...</span></>
          ) : done ? (
            <><CheckCircle className="text-green-500" size={18} /><span className="text-[9px] font-bold text-green-600">Done</span></>
          ) : (
            <><ImageIcon className="text-gray-400" size={18} /><span className="text-[9px] font-bold text-gray-400">Add Image</span></>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
