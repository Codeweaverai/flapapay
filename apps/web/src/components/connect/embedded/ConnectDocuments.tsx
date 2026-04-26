import React, { useEffect, useRef, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import { AlertCircle, FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

interface KYCDoc {
  id: string;
  document_type: string;
  file_url?: string;
  status: string;
  created_at: string;
  review_notes?: string;
}

interface ConnectDocumentsProps {
  onLoadError?: (error: Error) => void;
  onLoaderStart?: () => void;
}

export function ConnectDocuments({ onLoadError, onLoaderStart }: ConnectDocumentsProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [docs, setDocs] = useState<KYCDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('national_id');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (ctxLoading) return;
    if (ctxError) { setLoading(false); setError(ctxError); return; }
    onLoaderStart?.();
    portalFetch('/v1/connect/portal/kyc')
      .then(r => r.json())
      .then(d => { setDocs(d.documents || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); onLoadError?.(e); });
  };

  useEffect(() => { load(); }, [ctxLoading, ctxError]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      // Use portalFetch but strip Content-Type so browser sets multipart boundary
      const res = await portalFetch('/v1/connect/portal/kyc', {
        method: 'POST',
        body: formData,
      });
      // Remove Content-Type from the fetch — browser will auto-set multipart/form-data
      if (res.ok) load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const style: React.CSSProperties = {
    borderRadius: 'var(--flapa-radius, 1rem)',
    fontFamily: 'var(--flapa-font-family, inherit)',
  };

  if (loading || ctxLoading) return <DocSkeleton />;

  if (error) return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 flex items-center gap-3 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{error}</span>
    </div>
  );

  const DOC_TYPES = [
    { value: 'national_id', label: 'National ID (NRC)' },
    { value: 'passport', label: 'Passport' },
    { value: 'business_registration', label: 'Business Registration (PACRA)' },
    { value: 'tax_clearance', label: 'Tax Clearance (ZRA)' },
    { value: 'proof_of_address', label: 'Proof of Address' },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden" style={style}>
      <div className="px-6 py-4 border-b border-gray-50">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">KYC Documents</p>
        <p className="font-black text-gray-900">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</p>
      </div>

      {/* Upload Section */}
      <div className="px-6 py-4 bg-orange-50/50 border-b border-orange-100/50">
        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Upload Document</p>
        <div className="flex gap-3">
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--flapa-color-primary, #ea580c)' }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {doc.status === 'APPROVED' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                 doc.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-red-400" /> :
                 <Clock className="w-4 h-4 text-yellow-400" />}
                <div>
                  <p className="text-sm font-bold text-gray-900 capitalize">
                    {doc.document_type.replace(/_/g, ' ')}
                  </p>
                  {doc.review_notes && (
                    <p className="text-[11px] text-red-400 font-medium">{doc.review_notes}</p>
                  )}
                  <p className="text-[11px] text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                doc.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                doc.status === 'REJECTED' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'
              }`}>{doc.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 text-right">
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Powered by FlapaPay Connect</span>
      </div>
    </div>
  );
}

function DocSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="h-4 bg-gray-100 rounded w-28"></div>
      </div>
      <div className="px-6 py-4 bg-orange-50/50 border-b border-gray-50">
        <div className="h-10 bg-orange-100/50 rounded-xl"></div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
            <div className="h-4 bg-gray-100 rounded w-36"></div>
          </div>
          <div className="h-5 bg-gray-100 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}
