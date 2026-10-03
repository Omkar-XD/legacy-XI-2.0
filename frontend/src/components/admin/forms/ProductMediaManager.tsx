import React, { useRef, useState } from "react";
import { useFieldArray, Control, UseFormRegister, UseFormWatch, FieldErrors } from "react-hook-form";
import { GripVertical, Image as ImageIcon, Video, Trash2, ArrowUp, ArrowDown, UploadCloud, CheckCircle, Loader2 } from "lucide-react";
import { ProductFormValues } from "@/lib/validations/product";
import { apiClient } from "@/lib/api-client";
import toast from "react-hot-toast";

interface ProductMediaManagerProps {
  productId?: string;
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  pendingFilesRef: React.MutableRefObject<Map<string, File>>;
}

export function ProductMediaManager({ productId, control, register, watch, errors, pendingFilesRef }: ProductMediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  
  const { fields, append, remove, swap, update } = useFieldArray({
    control,
    name: "media"
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        const url = URL.createObjectURL(file);
        pendingFilesRef.current.set(url, file);
        
        append({ 
          type: isVideo ? "VIDEO" : "IMAGE", 
          url: url, 
          sortOrder: fields.length, 
          posterUrl: "", 
          alt: file.name
        });
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadSingleMedia = async (index: number) => {
    if (!productId) return;
    const m = watch(`media.${index}`);
    
    setIsUploading(prev => ({ ...prev, [m.url]: true }));
    try {
      if (m.url.startsWith('blob:')) {
        const file = pendingFilesRef.current.get(m.url);
        if (!file) throw new Error("File not found");
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resource_type', m.type === 'VIDEO' ? 'video' : 'image');
        formData.append('sort_order', m.sortOrder.toString());
        if (m.alt) formData.append('alt_text', m.alt);
        
        const res = await apiClient.post<any>(`/api/admin/products/${productId}/media`, formData);
        toast.success(`Image uploaded successfully!`);
        update(index, { ...m, id: res.media.id, url: res.media.url });
        pendingFilesRef.current.delete(m.url);
      } else if (!m.id) {
        // Upload via external URL
        const res = await apiClient.post<any>(`/api/admin/products/${productId}/media-url`, {
          url: m.url,
          resource_type: m.type === 'VIDEO' ? 'video' : 'image',
          sort_order: m.sortOrder
        });
        toast.success(`External URL uploaded successfully!`);
        update(index, { ...m, id: res.media.id, url: res.media.url });
      }
    } catch (err: any) {
      toast.error(`Failed to upload media: ${err.message}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [m.url]: false }));
    }
  };

  const uploadAllPending = async () => {
    if (!productId) {
      toast.error("Please save the product first before manually uploading media.");
      return;
    }
    setIsUploadingAll(true);
    let successCount = 0;
    
    for (let i = 0; i < fields.length; i++) {
      const m = watch(`media.${i}`);
      if (!m.id && (m.url.startsWith('blob:') || m.url.trim() !== "")) {
        try {
          if (m.url.startsWith('blob:')) {
            const file = pendingFilesRef.current.get(m.url);
            if (!file) continue;
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('resource_type', m.type === 'VIDEO' ? 'video' : 'image');
            formData.append('sort_order', m.sortOrder.toString());
            if (m.alt) formData.append('alt_text', m.alt);
            
            const res = await apiClient.post<any>(`/api/admin/products/${productId}/media`, formData);
            update(i, { ...m, id: res.media.id, url: res.media.url });
            pendingFilesRef.current.delete(m.url);
            successCount++;
          } else if (!m.id) {
            const res = await apiClient.post<any>(`/api/admin/products/${productId}/media-url`, {
              url: m.url,
              resource_type: m.type === 'VIDEO' ? 'video' : 'image',
              sort_order: m.sortOrder
            });
            update(i, { ...m, id: res.media.id, url: res.media.url });
            successCount++;
          }
        } catch (err: any) {
          console.error(`Failed to upload index ${i}:`, err);
        }
      }
    }
    
    setIsUploadingAll(false);
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} pending media items!`);
    } else {
      toast.error(`No pending media to upload, or upload failed.`);
    }
  };

  const hasPendingUploads = fields.some((f, i) => {
    const m = watch(`media.${i}`);
    return !m.id && (m.url.startsWith('blob:') || m.url.trim() !== "");
  });

  return (
      <div 
        className="space-y-4"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
              const isVideo = file.type.startsWith("video/");
              // We create an object URL for local preview.
              const url = URL.createObjectURL(file);
              // We store the file object outside RHF so it survives submission
              pendingFilesRef.current.set(url, file);
              
              append({ 
                type: isVideo ? "VIDEO" : "IMAGE", 
                url: url, 
                sortOrder: fields.length, 
                posterUrl: "", 
                alt: file.name
              });
            });
          }
        }}
      >
      {fields.length === 0 && (
        <div className="border-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-black/50 transition-colors">
          <UploadCloud className="w-8 h-8 text-black/20 mb-3" />
          <p className="font-heading font-bold uppercase tracking-widest text-sm mb-1 text-black/60">Drag & Drop Media Here</p>
          <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/40">or use the buttons below to add images and videos</p>
        </div>
      )}

      {fields.map((field, index) => {
        const mediaType = watch(`media.${index}.type`);
        const url = watch(`media.${index}.url`);
        const mediaId = watch(`media.${index}.id`);
        const isPending = !mediaId && (url.startsWith("blob:") || url.trim() !== "");
        const currentlyUploading = isUploading[url];
        
        return (
          <div key={field.id} className="flex flex-col p-4 border border-black/10 bg-black/[0.02] relative group">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full">
              {/* Reorder Controls */}
              <div className="flex flex-row sm:flex-col items-center justify-center gap-2 pb-3 sm:pb-0 pr-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-black/10">
                <button 
                  type="button" 
                  onClick={() => index > 0 && swap(index, index - 1)}
                  disabled={index === 0}
                  className="p-1.5 bg-white border border-black/10 text-black/40 hover:text-black disabled:opacity-30 transition-colors"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => index < fields.length - 1 && swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                  className="p-1.5 bg-white border border-black/10 text-black/40 hover:text-black disabled:opacity-30 transition-colors"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Box */}
              <div className="w-full sm:w-32 h-32 sm:h-auto sm:aspect-square bg-black/5 flex flex-col items-center justify-center border border-black/10 overflow-hidden flex-shrink-0 relative">
                {url && !url.startsWith("blob:") ? (
                  mediaType === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-black/80 text-white">
                      <Video className="w-8 h-8 opacity-50 mb-2" />
                      <span className="text-[10px] font-heading uppercase tracking-widest">Video</span>
                    </div>
                  )
                ) : url && url.startsWith("blob:") ? (
                  <img src={url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <ImageIcon className="w-6 h-6 text-black/20" />
                )}
              </div>

              <div className="flex-1 w-full flex flex-col">
                {/* Hidden Fields */}
                <input type="hidden" {...register(`media.${index}.id` as const)} />
                <input type="hidden" {...register(`media.${index}.type` as const)} />
                <input type="hidden" {...register(`media.${index}.sortOrder` as const, { valueAsNumber: true })} value={index} />
                {/* URL Input (only shown if not a pending file upload and not an existing uploaded file) */}
                {(!url || (!url.startsWith("blob:") && !mediaId)) ? (
                  <div className="mb-3">
                    <label className="block font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">External URL (e.g. Google Drive)</label>
                    <input 
                      type="text" 
                      {...register(`media.${index}.url` as const)}
                      placeholder="https://..."
                      className="w-full border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                    />
                    {errors.media?.[index]?.url && <p className="text-red-600 text-[10px] mt-1">{errors.media[index]?.url?.message}</p>}
                  </div>
                ) : (
                  <input type="hidden" {...register(`media.${index}.url` as const)} />
                )}
                
                {mediaType === "VIDEO" && (
                  <input type="hidden" {...register(`media.${index}.posterUrl` as const)} />
                )}
                
                <div className="mb-2">
                  <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">
                    {mediaType === "VIDEO" ? "Video" : "Image"} • Order: {index + 1}
                  </p>
                  {!mediaId && url.startsWith("blob:") && (
                    <p className="font-heading font-bold uppercase tracking-widest text-[8px] text-green-600/70">
                      Pending Upload
                    </p>
                  )}
                  {mediaId && (
                    <p className="font-heading font-bold uppercase tracking-widest text-[8px] text-blue-600/70 flex items-center gap-1">
                      <CheckCircle className="w-2 h-2" /> Uploaded File
                    </p>
                  )}
                </div>

                <div className="w-full mb-3">
                  <label className="block font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Alt Text (Accessibility & SEO)</label>
                  <input 
                    type="text" 
                    {...register(`media.${index}.alt` as const)}
                    placeholder="e.g. Front view of Real Madrid Home Kit"
                    className="w-full border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                  />
                </div>
                
                <div className="mt-auto pt-2 flex justify-end">
                  {productId && isPending && (
                    <button
                      type="button"
                      onClick={() => uploadSingleMedia(index)}
                      disabled={currentlyUploading}
                      className="px-4 py-1.5 bg-black text-white font-heading font-bold uppercase tracking-widest text-[10px] hover:bg-black/80 transition-colors flex items-center gap-2"
                    >
                      {currentlyUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                      <span>{currentlyUploading ? "Uploading..." : "Upload Now"}</span>
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm border border-black/10 text-black/40 hover:text-red-600 transition-colors rounded-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Remove Media"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {errors.media && <p className="text-red-600 text-xs">{errors.media.message}</p>}

      <div className="flex gap-3 pt-2">
        <input 
          type="file" 
          ref={fileInputRef}
          multiple 
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 border-2 border-dashed border-black/20 flex items-center justify-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs text-black/60 hover:border-black hover:text-black transition-colors rounded-none bg-white"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Select Files</span>
        </button>
        <button 
          type="button" 
          onClick={() => append({ type: "IMAGE", url: "", sortOrder: fields.length, posterUrl: "", alt: "" })}
          className="flex-1 py-3 border-2 border-dashed border-black/20 flex items-center justify-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs text-black/60 hover:border-black hover:text-black transition-colors rounded-none bg-white"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Add via URL</span>
        </button>
      </div>

      {productId && hasPendingUploads && (
        <div className="pt-4 border-t border-black/10 mt-4">
          <button
            type="button"
            onClick={uploadAllPending}
            disabled={isUploadingAll}
            className="w-full py-3 bg-black text-white flex items-center justify-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {isUploadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            <span>{isUploadingAll ? "Uploading All..." : "Upload All Pending Media"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
