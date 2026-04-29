/**
 * DocumentsPage.tsx — Step 5
 *
 * Features:
 *  - Drag-and-drop upload zone (react-dropzone)
 *  - Upload progress indicator
 *  - Share modal — enter a User ID or email to share with
 *  - Public/Private visibility toggle
 *  - Download, Delete
 *  - File type icons with colour coding
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, Download, Trash2, Share2, Loader,
  Globe, Lock, X, CheckCircle, AlertCircle, File,
  Image, Table, Presentation,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Document } from '../../types';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── File type helpers ────────────────────────────────────────────────────────
const getMimeLabel = (mime: string) => {
  if (mime.includes('pdf'))                                    return 'PDF';
  if (mime.includes('word') || mime.includes('msword'))        return 'Word';
  if (mime.includes('spreadsheet') || mime.includes('excel'))  return 'Excel';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'Slides';
  if (mime.includes('image'))                                  return 'Image';
  if (mime.includes('text'))                                   return 'Text';
  return 'File';
};

const FileIcon: React.FC<{ mime: string; className?: string }> = ({ mime, className = '' }) => {
  const base = `${className}`;
  if (mime.includes('pdf'))          return <FileText className={`${base} text-red-500`} />;
  if (mime.includes('word'))         return <FileText className={`${base} text-blue-500`} />;
  if (mime.includes('spreadsheet') || mime.includes('excel'))
                                     return <Table    className={`${base} text-green-500`} />;
  if (mime.includes('presentation')) return <Presentation className={`${base} text-orange-500`} />;
  if (mime.includes('image'))        return <Image    className={`${base} text-purple-500`} />;
  return                                    <File     className={`${base} text-gray-400`} />;
};

const BADGE_VARIANT: Record<string, any> = {
  PDF: 'error', Word: 'primary', Excel: 'success',
  Slides: 'warning', Image: 'accent', Text: 'gray', File: 'gray',
};

// ── Share Modal ──────────────────────────────────────────────────────────────
interface ShareModalProps {
  doc: Document;
  onClose: () => void;
  onUpdated: (doc: Document) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ doc, onClose, onUpdated }) => {
  const [shareInput, setShareInput] = useState('');
  const [isPublic, setIsPublic]     = useState(doc.isPublic);
  const [saving, setSaving]         = useState(false);
  const [sharedWith, setSharedWith] = useState<string[]>(doc.sharedWith || []);

  const handleAddUser = () => {
    const id = shareInput.trim();
    if (!id || sharedWith.includes(id)) return;
    setSharedWith(prev => [...prev, id]);
    setShareInput('');
  };

  const handleRemoveUser = (id: string) => {
    setSharedWith(prev => prev.filter(u => u !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await documentService.share(doc.id, sharedWith, isPublic);
      onUpdated(updated);
      toast.success('Sharing settings saved');
      onClose();
    } catch {
      // toast from interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileIcon mime={doc.mimetype} className="w-5 h-5" />
            <h2 className="font-semibold text-gray-900 truncate max-w-xs">{doc.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Public toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic
                ? <Globe size={20} className="text-green-500" />
                : <Lock size={20} className="text-gray-400" />}
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {isPublic ? 'Public — visible to everyone' : 'Private — only you and shared users'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isPublic ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Share with specific users */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Share with (User IDs)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste a User ID…"
                value={shareInput}
                onChange={e => setShareInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                fullWidth
              />
              <Button variant="outline" size="sm" onClick={handleAddUser}>Add</Button>
            </div>

            {sharedWith.length > 0 && (
              <div className="mt-3 space-y-2">
                {sharedWith.map(uid => (
                  <div key={uid} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-xs text-gray-600 font-mono truncate">{uid}</span>
                    <button onClick={() => handleRemoveUser(uid)} className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} isLoading={saving}>Save</Button>
        </div>
      </div>
    </div>
  );
};

// ── Upload progress item ─────────────────────────────────────────────────────
interface UploadItem {
  name: string;
  status: 'uploading' | 'done' | 'error';
}

// ── Main page ────────────────────────────────────────────────────────────────
export const DocumentsPage: React.FC = () => {
  const { user }                            = useAuth();
  const [documents, setDocuments]           = useState<Document[]>([]);
  const [loading, setLoading]               = useState(true);
  const [uploads, setUploads]               = useState<UploadItem[]>([]);
  const [shareTarget, setShareTarget]       = useState<Document | null>(null);

  useEffect(() => {
    documentService.getDocuments()
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Dropzone ───────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setUploads(prev => [...prev, { name: file.name, status: 'uploading' }]);
      try {
        const doc = await documentService.upload(file);
        setDocuments(prev => [doc, ...prev]);
        setUploads(prev =>
          prev.map(u => u.name === file.name ? { ...u, status: 'done' } : u)
        );
        // Remove success item after 2.5 s
        setTimeout(() => {
          setUploads(prev => prev.filter(u => !(u.name === file.name && u.status === 'done')));
        }, 2500);
      } catch {
        setUploads(prev =>
          prev.map(u => u.name === file.name ? { ...u, status: 'error' } : u)
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
    multiple: true,
    onDropRejected: (rejections) => {
      rejections.forEach(r => {
        const msg = r.errors[0]?.message || 'File rejected';
        toast.error(`${r.file.name}: ${msg}`);
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    await documentService.delete(id).catch(() => {});
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success('Document deleted');
  };

  const handleDocumentUpdated = (updated: Document) => {
    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const ownedDocs  = documents.filter(d => d.ownerId === user?.id);
  const sharedDocs = documents.filter(d => d.ownerId !== user?.id);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Share modal */}
      {shareTarget && (
        <ShareModal
          doc={shareTarget}
          onClose={() => setShareTarget(null)}
          onUpdated={handleDocumentUpdated}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">Upload, manage, and share your business documents</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop files here…</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">Drag & drop files here, or click to browse</p>
            <p className="text-gray-400 text-sm mt-1">PDF, Word, Excel, PowerPoint, Images · Max 10 MB each</p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
              {u.status === 'uploading' && <Loader size={16} className="animate-spin text-primary-500 flex-shrink-0" />}
              {u.status === 'done'      && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
              {u.status === 'error'     && <AlertCircle size={16} className="text-red-500 flex-shrink-0" />}
              <span className="text-sm text-gray-700 truncate">{u.name}</span>
              <span className={`text-xs ml-auto flex-shrink-0 ${
                u.status === 'done' ? 'text-green-500' : u.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {u.status === 'uploading' ? 'Uploading…' : u.status === 'done' ? 'Done' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* My documents */}
      <DocumentTable
        title="My Documents"
        docs={ownedDocs}
        isOwner
        onDelete={handleDelete}
        onShare={setShareTarget}
      />

      {/* Shared with me */}
      {sharedDocs.length > 0 && (
        <DocumentTable
          title="Shared With Me"
          docs={sharedDocs}
          isOwner={false}
          onDelete={handleDelete}
          onShare={setShareTarget}
        />
      )}
    </div>
  );
};

// ── Reusable document table ──────────────────────────────────────────────────
interface TableProps {
  title: string;
  docs: Document[];
  isOwner: boolean;
  onDelete: (id: string) => void;
  onShare: (doc: Document) => void;
}

const DocumentTable: React.FC<TableProps> = ({ title, docs, isOwner, onDelete, onShare }) => (
  <Card>
    <CardHeader>
      <h2 className="text-lg font-medium text-gray-900">{title}
        <span className="ml-2 text-sm font-normal text-gray-400">({docs.length})</span>
      </h2>
    </CardHeader>
    <CardBody>
      {docs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No documents here yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Type', 'Size', 'Uploaded', 'Visibility', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {docs.map(doc => {
                const label = getMimeLabel(doc.mimetype);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileIcon mime={doc.mimetype} className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={BADGE_VARIANT[label] || 'gray'} size="sm">{label}</Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {documentService.formatSize(doc.size)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {doc.isPublic
                          ? <Globe size={14} className="text-green-500" />
                          : <Lock size={14} className="text-gray-400" />}
                        <Badge variant={doc.isPublic ? 'success' : 'gray'} size="sm">
                          {doc.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="sm"
                          leftIcon={<Download size={13} />}
                          onClick={() => window.open(documentService.getDownloadUrl(doc.id), '_blank')}
                        >
                          Download
                        </Button>
                        {isOwner && (
                          <>
                            <Button
                              variant="ghost" size="sm"
                              leftIcon={<Share2 size={13} />}
                              onClick={() => onShare(doc)}
                            >
                              Share
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              leftIcon={<Trash2 size={13} className="text-red-500" />}
                              onClick={() => onDelete(doc.id)}
                            >
                              <span className="text-red-500">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardBody>
  </Card>
);
