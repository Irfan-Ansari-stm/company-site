'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Modal, Input, ConfirmDialog } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Upload, FolderPlus, Trash2, Download, Image as ImageIcon,
  FileText, Film, Music, FolderOpen, ChevronRight, X, Copy,
  Check, Edit2, ExternalLink, MoreVertical, Eye
} from 'lucide-react';

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
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
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals & Dialogs
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<any>(null);

  const [renamingFile, setRenamingFile] = useState<any>(null);
  const [newFileName, setNewFileName] = useState('');
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Queries
  const { data: foldersData } = useQuery({
    queryKey: ['media-folders', currentFolder?.id],
    queryFn: () => mediaApi.getFolders(currentFolder?.id).then(r => r.data.data),
  });

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media', { folder: currentFolder?.id, search }],
    queryFn: () => mediaApi.list({ folder_id: currentFolder?.id, search: search || undefined, limit: 50 }).then(r => r.data),
  });

  // Folder Mutations
  const createFolderMutation = useMutation({
    mutationFn: () => mediaApi.createFolder(folderName, currentFolder?.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-folders'] });
      setShowNewFolder(false);
      setFolderName('');
      toast.success('Folder created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => mediaApi.updateFolder(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-folders'] });
      setRenamingFolder(null);
      toast.success('Folder renamed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => mediaApi.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-folders'] });
      setFolderToDelete(null);
      toast.success('Folder deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // File Mutations
  const updateFileMutation = useMutation({
    mutationFn: ({ id, original_name }: { id: string; original_name: string }) =>
      mediaApi.update(id, { original_name }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      if (previewItem && previewItem.id === renamingFile?.id) {
        setPreviewItem({ ...previewItem, original_name: newFileName });
      }
      setRenamingFile(null);
      toast.success('File renamed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      setFileToDelete(null);
      if (previewItem && previewItem.id === fileToDelete?.id) {
        setPreviewItem(null);
      }
      toast.success('File deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      if (files.length === 1) {
        await mediaApi.upload(files[0], { folder_id: currentFolder?.id });
      } else {
        await mediaApi.uploadMultiple(Array.from(files), currentFolder?.id);
      }
      qc.invalidateQueries({ queryKey: ['media'] });
      toast.success(`${files.length} file(s) uploaded successfully`);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const files = mediaData?.data || [];
  const folders = foldersData || [];

  return (
    <DashboardLayout title="Media Library" breadcrumbs={[{ label: 'Media' }]}>
      <div className="space-y-5">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search files by name..."
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={<FolderPlus className="w-4 h-4 text-amber-500" />}
              onClick={() => { setFolderName(''); setShowNewFolder(true); }}
            >
              New Folder
            </Button>
            <Button
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              Upload Files
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleFileUpload(e.target.files)}
            />

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="Grid View"
              >
                ⊞ Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="List View"
              >
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Upload Drop Zone Banner */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer bg-slate-50/50"
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="w-7 h-7 mx-auto mb-2 text-blue-500" />
          <p className="font-medium text-slate-700">Drop files anywhere to upload, or click here to browse</p>
          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, GIF, SVG, WebP, PDF, MP4, MP3 up to 25MB</p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 w-fit">
          <button
            className={`font-medium hover:text-blue-600 transition-colors ${!currentFolder ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}
            onClick={() => setCurrentFolder(null)}
          >
            Media Root
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-semibold">{currentFolder.name}</span>
            </>
          )}
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Folders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((folder: any) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                  onClick={() => setCurrentFolder({ id: folder.id, name: folder.name })}
                >
                  <FolderOpen className="w-10 h-10 text-amber-400 group-hover:text-amber-500 mb-1" />
                  <span className="text-xs font-medium text-slate-700 truncate w-full text-center" title={folder.name}>
                    {folder.name}
                  </span>
                  <span className="text-[11px] text-slate-400">{folder.file_count || 0} items</span>

                  {/* Folder Quick Actions */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/90 p-0.5 rounded-md shadow-xs">
                    <button
                      type="button"
                      className="p-1 hover:text-blue-600 text-slate-400 rounded"
                      title="Rename folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolder(folder);
                        setNewFolderName(folder.name);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:text-red-600 text-slate-400 rounded"
                      title="Delete folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderToDelete(folder);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Files ({files.length})
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No files in this folder</p>
              <p className="text-xs text-slate-400 mt-1">Upload files using the drag zone above or the Upload button</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((file: any) => (
                <div
                  key={file.id}
                  className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between"
                  onClick={() => setPreviewItem(file)}
                >
                  {/* Thumbnail / Icon Container */}
                  <div className="w-full aspect-square bg-slate-50 flex items-center justify-center overflow-hidden relative">
                    {file.mime_type?.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.original_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-4 flex flex-col items-center justify-center">
                        {getFileIcon(file.mime_type)}
                        <span className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                          {file.extension || file.mime_type?.split('/')[1] || 'file'}
                        </span>
                      </div>
                    )}

                    {/* Quick Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600 flex items-center justify-center shadow-xs"
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(file); }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600 flex items-center justify-center shadow-xs"
                        title="Copy URL"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(file.url); }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600 flex items-center justify-center shadow-xs"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFile(file);
                          setNewFileName(file.original_name);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center justify-center shadow-xs"
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); setFileToDelete(file); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="p-2.5 border-t border-slate-100 bg-white">
                    <p className="text-xs font-medium text-slate-800 truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.extension?.toUpperCase() || ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card padding={false}>
              <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Size</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Uploaded</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {files.map((file: any) => (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        onClick={() => setPreviewItem(file)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {file.mime_type?.startsWith('image/') ? (
                              <img src={file.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                {getFileIcon(file.mime_type)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate max-w-xs sm:max-w-md">{file.original_name}</p>
                              <p className="text-xs text-slate-400 truncate">{file.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{file.mime_type || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatFileSize(file.size)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(file.created_at)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              title="Preview"
                              onClick={() => setPreviewItem(file)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Copy className="w-3.5 h-3.5" />}
                              title="Copy URL"
                              onClick={() => copyToClipboard(file.url)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              title="Rename"
                              onClick={() => {
                                setRenamingFile(file);
                                setNewFileName(file.original_name);
                              }}
                            />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Download className="w-3.5 h-3.5" />}
                                title="Download"
                              />
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                              title="Delete"
                              onClick={() => setFileToDelete(file)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      <Modal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="Create New Folder"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button
              loading={createFolderMutation.isPending}
              disabled={!folderName.trim()}
              onClick={() => createFolderMutation.mutate()}
            >
              Create Folder
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Folder Name"
            placeholder="e.g. Products, Banners, Avatars"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-slate-400">
            Folders help organize your media assets across the dashboard and public website.
          </p>
        </div>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        open={!!renamingFolder}
        onClose={() => setRenamingFolder(null)}
        title="Rename Folder"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button>
            <Button
              loading={updateFolderMutation.isPending}
              disabled={!newFolderName.trim() || newFolderName === renamingFolder?.name}
              onClick={() => updateFolderMutation.mutate({ id: renamingFolder.id, name: newFolderName })}
            >
              Save Name
            </Button>
          </>
        }
      >
        <Input
          label="Folder Name"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          autoFocus
        />
      </Modal>

      {/* Rename File Modal */}
      <Modal
        open={!!renamingFile}
        onClose={() => setRenamingFile(null)}
        title="Rename File"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenamingFile(null)}>Cancel</Button>
            <Button
              loading={updateFileMutation.isPending}
              disabled={!newFileName.trim() || newFileName === renamingFile?.original_name}
              onClick={() => updateFileMutation.mutate({ id: renamingFile.id, original_name: newFileName })}
            >
              Save Name
            </Button>
          </>
        }
      >
        <Input
          label="File Name"
          value={newFileName}
          onChange={e => setNewFileName(e.target.value)}
          autoFocus
        />
      </Modal>

      {/* Complete File Preview & Detail Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="min-w-0 pr-4">
                <h3 className="font-semibold text-slate-900 truncate" title={previewItem.original_name}>
                  {previewItem.original_name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{previewItem.mime_type || 'Unknown MIME'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Preview & Details */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Media Player / Image Display */}
              <div className="bg-slate-900/5 rounded-xl border border-slate-100 flex items-center justify-center p-4 min-h-[220px] max-h-[360px] overflow-hidden">
                {previewItem.mime_type?.startsWith('image/') ? (
                  <img
                    src={previewItem.url}
                    alt={previewItem.original_name}
                    className="max-h-[320px] max-w-full object-contain rounded-lg shadow-xs"
                  />
                ) : previewItem.mime_type?.startsWith('video/') ? (
                  <video controls className="max-h-[320px] max-w-full rounded-lg">
                    <source src={previewItem.url} type={previewItem.mime_type} />
                    Your browser does not support video playback.
                  </video>
                ) : previewItem.mime_type?.startsWith('audio/') ? (
                  <audio controls className="w-full max-w-md">
                    <source src={previewItem.url} type={previewItem.mime_type} />
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-700">Preview not available for this file type</p>
                    <p className="text-xs text-slate-400 mt-1">Use download below to view this file locally</p>
                  </div>
                )}
              </div>

              {/* URL Copy Bar */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Direct Asset URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewItem.url || ''}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono select-all focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    onClick={() => copyToClipboard(previewItem.url)}
                  >
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Metadata Grid */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  File Metadata
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-0.5">File Size</span>
                    <span className="font-medium text-slate-800">{formatFileSize(previewItem.size)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Content Type</span>
                    <span className="font-medium text-slate-800">{previewItem.mime_type || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Extension</span>
                    <span className="font-medium text-slate-800 uppercase">{previewItem.extension || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Uploaded Date</span>
                    <span className="font-medium text-slate-800">{formatDate(previewItem.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Storage Provider</span>
                    <span className="font-medium text-slate-800 capitalize">{previewItem.storage_provider || 'Local'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Uploaded By</span>
                    <span className="font-medium text-slate-800">{previewItem.uploaded_by_name || 'Admin'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setFileToDelete(previewItem)}
              >
                Delete File
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => {
                    setRenamingFile(previewItem);
                    setNewFileName(previewItem.original_name);
                  }}
                >
                  Rename
                </Button>
                <a href={previewItem.url} target="_blank" rel="noopener noreferrer" download>
                  <Button
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm File Delete Dialog */}
      <ConfirmDialog
        open={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => fileToDelete && deleteMutation.mutate(fileToDelete.id)}
        title="Delete Media File"
        description={`Are you sure you want to delete "${fileToDelete?.original_name}"? This file will be removed from the media library and any referencing pages may lose their image.`}
        confirmText="Delete File"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Confirm Folder Delete Dialog */}
      <ConfirmDialog
        open={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={() => folderToDelete && deleteFolderMutation.mutate(folderToDelete.id)}
        title="Delete Media Folder"
        description={`Are you sure you want to delete the folder "${folderToDelete?.name}"? Empty folders will be permanently deleted.`}
        confirmText="Delete Folder"
        variant="danger"
        loading={deleteFolderMutation.isPending}
      />
    </DashboardLayout>
  );
}