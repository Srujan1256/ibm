import React, { useState } from 'react';
import { Terminal, Send, Check, Copy, Globe, Shield, Sparkles } from 'lucide-react';

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('predict');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(
      {
        crop: 'tomato',
        daysSinceHarvest: 3,
        ambientTempC: 34,
        ambientHumidityPct: 50,
        storageType: 'ambient_crates',
        ripenessStage: 'ripe',
        surfaceDamagePct: 5,
      },
      null,
      2
    )
  );
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    {
      id: 'predict',
      method: 'POST',
      url: '/api/predict',
      desc: 'Predict remaining shelf-life & risk level via ML model',
      defaultBody: {
        crop: 'tomato',
        daysSinceHarvest: 3,
        ambientTempC: 34,
        ambientHumidityPct: 50,
        storageType: 'ambient_crates',
        ripenessStage: 'ripe',
        surfaceDamagePct: 5,
      },
    },
    {
      id: 'webhook_whatsapp',
      method: 'POST',
      url: '/webhook/whatsapp',
      desc: 'Twilio / WhatsApp Cloud API incoming webhook simulator',
      defaultBody: {
        from: '+91 98234 10001',
        senderName: 'Ramesh Patel',
        text: 'नमस्ते, 3 दिन पहले 1200 किलो टमाटर तोड़े थे। गर्मी 34 डिग्री है, क्रेट में रखे हैं। कब बेचूं?',
        messageType: 'text',
        language: 'hi',
      },
    },
    {
      id: 'harvest_report',
      method: 'POST',
      url: '/api/harvest/report',
      desc: 'Submit full harvest report & trigger matchmaking',
      defaultBody: {
        farmerName: 'Suresh Patil',
        farmerPhone: '+91 97654 20002',
        crop: 'banana',
        quantityKg: 4000,
        daysSinceHarvest: 1,
        storageType: 'ambient_bags',
        ambientTempC: 33,
        ambientHumidityPct: 55,
        detectedLanguage: 'en',
      },
    },
    {
      id: 'buyers',
      method: 'GET',
      url: '/api/buyers?crop=tomato',
      desc: 'List nearby APMC mandi commission agents & buyers',
      defaultBody: null,
    },
    {
      id: 'storage',
      method: 'GET',
      url: '/api/storage?crop=banana',
      desc: 'List verified cold storage facilities & capacity',
      defaultBody: null,
    },
    {
      id: 'dashboard',
      method: 'GET',
      url: '/api/admin/dashboard',
      desc: 'FPO Command Center aggregated SDG & pilot metrics',
      defaultBody: null,
    },
  ];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setSelectedEndpoint(ep.id);
    setRequestBody(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseOutput('');
  };

  const handleExecute = async () => {
    const ep = endpoints.find((e) => e.id === selectedEndpoint);
    if (!ep) return;

    setIsLoading(true);
    try {
      const options: RequestInit = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (ep.method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(ep.url, options);
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message || 'Request failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurl = () => {
    const ep = endpoints.find((e) => e.id === selectedEndpoint);
    if (!ep) return;
    const curl =
      ep.method === 'POST'
        ? `curl -X POST http://localhost:3000${ep.url} \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, '')}'`
        : `curl -X GET http://localhost:3000${ep.url}`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              API Explorer & WhatsApp Webhook Sandbox
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Test backend REST endpoints, inspect payloads, and integrate Twilio or WhatsApp Cloud API.
          </p>
        </div>

        <button
          onClick={handleCopyCurl}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2 mb-2">
            Available Endpoints
          </div>
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => handleSelectEndpoint(ep)}
              className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                selectedEndpoint === ep.id
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    ep.method === 'POST' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-xs font-bold text-stone-900 font-mono">
                  {ep.url.split('?')[0]}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 leading-tight">
                {ep.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Request & Response Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    activeEp.method === 'POST' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                  }`}
                >
                  {activeEp.method}
                </span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  {activeEp.url}
                </span>
              </div>

              <button
                disabled={isLoading}
                onClick={handleExecute}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Request Body Editor */}
            {activeEp.defaultBody && (
              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  JSON Request Body:
                </label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-stone-300 bg-stone-950 text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Response Console */}
          <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="font-mono uppercase font-bold text-[11px]">Server Response</span>
              <span className="text-[10px] text-stone-500">HTTP 200 OK</span>
            </div>

            <pre className="font-mono text-xs text-stone-200 overflow-x-auto p-2 bg-stone-900/60 rounded-xl min-h-[160px] max-h-[320px]">
              {responseOutput || '// Click "Send Request" to test endpoint against live backend.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
