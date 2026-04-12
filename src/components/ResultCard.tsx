import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Shield, MapPin, Network, User, Smartphone, Hash, Layers } from 'lucide-react';

interface ResultData {
  Name: string;
  Mobile: string;
  Country: string;
  CNIC: string;
  Address: string;
}

interface ResultCardProps {
  data: ResultData;
  color: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, color }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllData = () => {
    const allData = fields.map(f => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(allData);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields = [
    { label: 'Full Name', value: data.Name, icon: User },
    { label: 'Mobile Number', value: data.Mobile, icon: Smartphone },
    { label: 'Country', value: data.Country, icon: Network },
    { label: 'CNIC Number', value: data.CNIC, icon: Hash },
    { label: 'Full Address', value: data.Address, icon: MapPin },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-card rounded-xl p-6 border border-white/10 relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold tracking-wider uppercase flex items-center gap-2" style={{ color }}>
          <Shield size={20} />
          Real Data Record
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={copyAllData}
            className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group/copyall"
            title="Copy all details"
          >
            {copiedField === 'all' ? (
              <>
                <Check size={12} className="text-green-400" />
                <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-white/50 group-hover/copyall:text-white transition-colors" />
                <span className="text-[10px] font-mono text-white/50 group-hover/copyall:text-white uppercase tracking-widest transition-colors">Copy All</span>
              </>
            )}
          </button>
          <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-white/50 uppercase tracking-widest">
            Ref: {Math.random().toString(36).substring(7).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div 
            key={field.label}
            className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-colors group/field"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1">
                <field.icon size={10} />
                {field.label}
              </span>
              <button
                onClick={() => copyToClipboard(field.value, field.label)}
                className="opacity-0 group-hover/field:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                title="Copy to clipboard"
              >
                {copiedField === field.label ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy size={12} className="text-white/50" />
                )}
              </button>
            </div>
            <div className="font-mono text-sm break-all">
              {field.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/30">
        <span>ENCRYPTION: AES-256-GCM</span>
        <span>ACCESS: GRANTED</span>
      </div>
    </motion.div>
  );
};
