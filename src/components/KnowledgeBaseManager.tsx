import React, { useState, useEffect } from 'react';
import { 
  Database, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  Plus, 
  Check, 
  AlertCircle, 
  Eye, 
  Layers, 
  ShieldCheck, 
  X 
} from 'lucide-react';
import { EnterpriseDocument } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const KnowledgeBaseManager: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<EnterpriseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<EnterpriseDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'HR Policies' | 'Cloud Infrastructure' | 'Executive & Financial' | 'Compliance & Legal' | 'Engineering'>('Engineering');
  const [newClassification, setNewClassification] = useState<'Restricted' | 'Confidential' | 'Internal'>('Internal');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleInspectDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDoc(data.document);
      }
    } catch (e) {
      console.error('Failed to inspect document:', e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this document from the vector index?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedDoc?.id === id) setSelectedDoc(null);
        await fetchDocuments();
      }
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and document content are required.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          classification: newClassification,
          content: newContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setNewTitle('');
        setNewContent('');
        await fetchDocuments();
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setStatusMessage(null);
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to upload document.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F3F4] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DADCE0] shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shadow-sm">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-base font-semibold text-[#202124]">Vertex AI Vector Search Repository</h1>
            </div>
            <p className="text-xs text-[#5F6368] mt-1">
              Ingested enterprise records chunked and indexed into ScANN 768-dimensional embedding shards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter documents..."
                className="pl-9 pr-3 py-2 text-xs bg-[#F1F3F4] border border-[#DADCE0] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8] text-[#202124]"
              />
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-md bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-xs text-[#70757A]">
              Loading vector indexes from Vertex AI...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-[#70757A]">
              No matching documents found in repository.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleInspectDoc(doc.id)}
                className="bg-white rounded-2xl border border-[#DADCE0] p-5 shadow-sm hover:border-[#1A73E8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F3F4] text-[#3C4043] font-medium">
                      {doc.category}
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      doc.classification === 'Restricted'
                        ? 'bg-[#FCE8E6] text-[#D93025] border-[#F1998E]'
                        : doc.classification === 'Confidential'
                        ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                        : 'bg-[#E8F0FE] text-[#1967D2] border-[#ADCCF9]'
                    }`}>
                      {doc.classification}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#202124] leading-snug">{doc.title}</h3>
                  <p className="text-xs text-[#5F6368] mt-2 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-[#1A73E8]">
                      <Layers className="w-3.5 h-3.5" />
                      {doc.chunkCount} Vector Chunks
                    </span>
                    <span>{doc.fileSize}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectDoc(doc.id);
                      }}
                      className="p-1.5 hover:bg-[#E8F0FE] text-[#1A73E8] rounded-md transition-colors"
                      title="Inspect Chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1.5 hover:bg-[#FCE8E6] text-[#D93025] rounded-md transition-colors"
                      title="Delete from Vector DB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Document Chunks Inspector Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#DADCE0] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-[#DADCE0] flex items-center justify-between bg-[#F8F9FA]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-[#E8F0FE] text-[#1967D2] px-2 py-0.5 rounded font-bold border border-[#ADCCF9]">
                      {selectedDoc.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#DADCE0] text-[#3C4043] font-medium">
                      {selectedDoc.classification}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#202124] mt-1">{selectedDoc.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-full hover:bg-[#DADCE0] text-[#5F6368] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-[#5F6368] font-medium">
                  Semantic Chunks generated by DocuFlow background ingestion service & Vertex AI Embeddings API:
                </p>

                {selectedDoc.chunks && selectedDoc.chunks.map((chunk, idx) => (
                  <div key={chunk.id || idx} className="p-4 rounded-xl border border-[#DADCE0] bg-[#F8F9FA] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A73E8] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {chunk.sectionTitle}
                      </span>
                      <span className="text-[10px] font-mono text-[#5F6368] bg-white border border-[#DADCE0] px-2 py-0.5 rounded">
                        Page {chunk.pageNumber} • ~{chunk.tokenCount} tokens
                      </span>
                    </div>
                    <p className="text-xs text-[#3C4043] font-mono leading-relaxed bg-white p-3 rounded-lg border border-[#DADCE0]">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#DADCE0] bg-[#F8F9FA] flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-md bg-[#202124] text-white text-xs font-medium hover:bg-[#3C4043] transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload & Ingest Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#DADCE0] w-full max-w-xl overflow-hidden">
              <div className="p-5 border-b border-[#DADCE0] flex items-center justify-between bg-[#202124] text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Ingest Corporate Document to RAG</h3>
                    <p className="text-[11px] text-[#ADCCF9]">Vertex AI Embeddings & Vector Search Ingestion</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#3C4043] text-[#BDC1C6] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
                {statusMessage && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-[#EEFBEB] text-[#1E8E3E] border border-[#CEEAD6]'
                      : 'bg-[#FCE8E6] text-[#D93025] border border-[#F1998E]'
                  }`}>
                    {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#3C4043] mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q4 Data Governance & AI Compliance Standard"
                    className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none bg-white"
                    >
                      <option value="HR Policies">HR Policies</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Executive & Financial">Executive & Financial</option>
                      <option value="Compliance & Legal">Compliance & Legal</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">Security Classification</label>
                    <select
                      value={newClassification}
                      onChange={(e) => setNewClassification(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none bg-white"
                    >
                      <option value="Internal">Internal (All Staff)</option>
                      <option value="Confidential">Confidential (Compliance+)</option>
                      <option value="Restricted">Restricted (Security Auditor Only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                    Document Content / Policy Text
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste corporate handbook text, architecture rules, or operational procedures here. The pipeline will automatically segment sentences into 500-token chunks with 50-token overlap..."
                    className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-[#DADCE0] flex items-center justify-between">
                  <span className="text-[11px] text-[#70757A]">Target: Vertex AI Vector Search</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-3.5 py-2 text-xs text-[#5F6368] hover:text-[#202124] rounded-md hover:bg-[#F8F9FA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? 'Vectorizing Chunks...' : 'Ingest & Index'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
