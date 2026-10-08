'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Modal, Input } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Upload, FolderPlus, Trash2, Download, Image, FileText, Film, Music, FolderOpen, ChevronRight, X } from 'lucide-react';

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return <Image className="w-6 h-6 text-blue-500" />;
  if (mimeType?.startsWith('video/')) return <Film className="w-6 h-6 text-purple-500" />;
  if (mimeType?.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
  return <FileText className="w-6 h-6 text-slate-400" />;
}

function formatFileSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MediaPage() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);

  const { data: foldersData } = useQuery({
    queryKey: ['media-folders', currentFolder],
    queryFn: () => mediaApi.getFolders(currentFolder).then(r => r.data.data),
  });

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media', { folder: currentFolder, search }],
    queryFn: () => mediaApi.list({ folder_id: currentFolder, search: search || undefined, limit: 50 }).then(r => r.data),
  });

  const createFolderMutation = useMutation({
    mutationFn: () => mediaApi.createFolder(folderName, currentFolder),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media-folders'] }); setShowNewFolder(false); setFolderName(''); toast.success('Folder created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('File deleted'); },
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      if (files.length === 1) {
        await mediaApi.upload(files[0], { folder_id: currentFolder });
      } else {
        await mediaApi.uploadMultiple(Array.from(files), currentFolder);
      }
      qc.invalidateQueries({ queryKey: ['media'] });
      toast.success(`${files.length} file(s) uploaded`);
    } catch (e: any) {
      toast.error(extractApiError(e));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const files = mediaData?.data || [];
  const folders = foldersData || [];

  return (
    <DashboardLayout title="Media Library" breadcrumbs={[{ label: 'Media' }]}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search files…" className="flex-1 max-w-xs" />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" icon={<FolderPlus className="w-4 h-4" />} onClick={() => setShowNewFolder(true)}>
              New Folder
            </Button>
            <Button size="sm" icon={<Upload className="w-4 h-4" />} loading={uploading}
              onClick={() => fileInput.current?.click()}>
              Upload
            </Button>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {mode === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone indicator at top */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="w-5 h-5 mx-auto mb-1" />
          Drop files here or click to upload
        </div>

        {/* Breadcrumbs */}
        {currentFolder && (
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <button className="hover:text-slate-800" onClick={() => setCurrentFolder(undefined)}>Media</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-800 font-medium">Current Folder</span>
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder: any) => (
              <button
                key={folder.id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                onDoubleClick={() => setCurrentFolder(folder.id)}
                onClick={() => setCurrentFolder(folder.id)}
              >
                <FolderOpen className="w-10 h-10 text-yellow-400 group-hover:text-yellow-500" />
                <span className="text-xs text-slate-700 truncate w-full text-center">{folder.name}</span>
                <span className="text-xs text-slate-400">{folder.file_count || 0} files</span>
              </button>
            ))}
          </div>
        )}

        {/* Files */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Image className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p>No files found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {files.map((file: any) => (
              <div
                key={file.id}
                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${selected.includes(file.id) ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'}`}
                onClick={() => setPreviewItem(file)}
              >
                {file.mime_type?.startsWith('image/') ? (
                  <img src={file.url} alt={file.original_name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-slate-50 flex items-center justify-center">
                    {getFileIcon(file.mime_type)}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-slate-700 truncate">{file.original_name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card padding={false}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Type', 'Size', 'Uploaded', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((file: any) => (
                  <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setPreviewItem(file)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {file.mime_type?.startsWith('image/') ? (
                          <img src={file.url} alt="" className="w-10 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-8 bg-slate-100 rounded flex items-center justify-center">{getFileIcon(file.mime_type)}</div>
                        )}
                        <span className="text-sm text-slate-800">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{file.mime_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(file.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} />
                        </a>
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          onClick={e => { e.stopPropagation(); deleteMutation.mutate(file.id); }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Folder Modal */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder"
        footer={<>
          <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
          <Button loading={createFolderMutation.isPending} onClick={() => createFolderMutation.mutate()}>Create</Button>
        </>}
      >
        <Input label="Folder Name" value={folderName} onChange={e => setFolderName(e.target.value)} autoFocus />
      </Modal>

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900 truncate">{previewItem.original_name}</p>
              <button onClick={() => setPreviewItem(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {previewItem.mime_type?.startsWith('image/') && (
                <img src={previewItem.url} alt="" className="max-w-full rounded-xl mx-auto" />
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[['Size', formatFileSize(previewItem.size)], ['Type', previewItem.mime_type], ['Uploaded', formatDate(previewItem.created_at)], ['By', previewItem.uploaded_by_name]].map(([k, v]) => v && (
                  <div key={k as string}>
                    <span className="text-slate-500">{k}: </span>
                    <span className="text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full" icon={<Download className="w-4 h-4" />}>Download</Button>
                </a>
                <Button
                  variant="danger"
                  onClick={() => { deleteMutation.mutate(previewItem.id); setPreviewItem(null); }}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
