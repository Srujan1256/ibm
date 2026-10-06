import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, MicOff, Image as ImageIcon, Volume2, VolumeX, CheckCheck, 
  MapPin, Phone, Building2, Snowflake, Factory, AlertTriangle, ShieldCheck, 
  RefreshCw, Sparkles, ChevronRight, Play, Pause, Info, User
} from 'lucide-react';
import { CropType, LanguageCode, StorageType, HarvestReport, SpoilagePrediction, Recommendation } from '../types';

interface Message {
  id: string;
  sender: 'farmer' | 'bot';
  text: string;
  timestamp: string;
  audioUrl?: string;
  audioScript?: string;
  imageUrl?: string;
  prediction?: SpoilagePrediction;
  recommendation?: Recommendation;
}

interface WhatsAppSimulatorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onReportCreated?: (report: HarvestReport) => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  currentLanguage,
  onLanguageChange,
  onReportCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'bot',
      text: currentLanguage === 'hi'
        ? '🌾 नमस्ते किसान भाई! मैं HarvestSaver AI हूँ। अपनी कटी हुई फसल (टमाटर, केला, आम) का वॉयस नोट, फोटो या जानकारी भेजें। हम आपको सड़न से बचाने और सही खरीदार से जोड़ने में मदद करेंगे।'
        : currentLanguage === 'gu'
        ? '🌾 નમસ્તે ખેડૂત મિત્ર! હું HarvestSaver AI છું. તમારા લણેલા પાક (ટામેટાં, કેળાં, કેરી) ની વિગત, ફોટો અથવા વૉઇસ મેસેજ મોકલો. અમે બગાડ અટકાવવા અને યોગ્ય વેચાણ માટે માર્ગદર્શન આપીશું.'
        : '🌾 Welcome! I am HarvestSaver AI. Send a voice note, photo, or message about your harvested crop (Tomato, Banana, Mango). We estimate spoilage risk and connect you with nearby buyers, cold storage, or food processors.',
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAudioPlayingId, setActiveAudioPlayingId] = useState<string | null>(null);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('tomato');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Audio recording timer simulation
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Quick farmer scenarios
  const scenarios = [
    {
      id: 'tomato-nashik',
      name: 'Ramesh Patel (Tomato)',
      crop: 'tomato' as CropType,
      location: 'Nashik, MH',
      quantity: '1,200 kg',
      promptEn: 'Harvested 1,200 kg tomatoes 3 days ago. Stored in shaded plastic crates. Ambient heat is 34°C. Need urgent advice before spoilage.',
      promptHi: 'नमस्ते, 3 दिन पहले 1200 किलो टमाटर तोड़े थे। क्रेट में रखे हैं, 34 डिग्री तेज गर्मी है। क्या आज ही बेच देना चाहिए?',
      promptGu: 'નમસ્તે, 3 દિવસ પહેલાં 1200 કિલો ટામેટાં ઉતાર્યા હતા. પ્લાસ્ટિક કેરેટમાં છે, 34 ડિગ્રી ગરમી છે. ક્યારે વેચવા?',
    },
    {
      id: 'banana-jalgaon',
      name: 'Suresh Patil (Banana)',
      crop: 'banana' as CropType,
      location: 'Jalgaon, MH',
      quantity: '4,000 kg',
      promptEn: 'Harvested 4,000 kg G9 bananas yesterday. Packed in gunny sheets. Mandi spot prices are low today, should I put them in cold storage?',
      promptHi: 'नमस्ते, कल 4000 किलो केले तोड़े थे। आज मंडी में भाव कम हैं। क्या इन्हें कोल्ड स्टोरेज में रखना सुरक्षित रहेगा?',
      promptGu: 'નમસ્તે, ગઈકાલે 4000 કિલો કેળાં ઉતાર્યા હતા. આજે મંડીમાં ભાવ ઓછા છે, શું કોલ્ડ સ્ટોરેજમાં રાખી શકાય?',
    },
    {
      id: 'mango-valsad',
      name: 'Bhavna Desai (Mango)',
      crop: 'mango' as CropType,
      location: 'Valsad, GJ',
      quantity: '850 kg',
      promptEn: '850 kg Kesar mangoes picked 4 days ago. Slightly soft with sun scald blemishes. Should I sell to local pulp processor?',
      promptHi: 'नमस्ते, 4 दिन पहले 850 किलो आम तोड़े थे। गर्मी से कुछ आम पक कर नरम हो रहे हैं। क्या पल्प फैक्ट्री में देना सही रहेगा?',
      promptGu: 'નમસ્તે, 4 દિવસ પહેલા 850 કિલો કેસર કેરી ઉતારી હતી. ગરમીથી પાકી રહી છે અને થોડા ડાઘ છે. શું પલ્પ ફેક્ટરીને આપવી?',
    },
  ];

  const handleApplyScenario = (sc: typeof scenarios[0]) => {
    setSelectedCrop(sc.crop);
    const text = currentLanguage === 'hi' ? sc.promptHi : currentLanguage === 'gu' ? sc.promptGu : sc.promptEn;
    setInputText(text);
  };

  const handleSendMessage = async (textToSend?: string, imageBase64?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() && !imageBase64) return;

    const userMessageId = 'msg-user-' + Date.now();
    const newMsg: Message = {
      id: userMessageId,
      sender: 'farmer',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: imageBase64 || previewImage || undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setPreviewImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: '+91 98234 10001',
          senderName: 'Farmer',
          messageType: imageBase64 ? 'image' : 'text',
          text: content,
          imageBase64: imageBase64,
          language: currentLanguage,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' || data.responseMessage) {
        const botMsg: Message = {
          id: 'msg-bot-' + Date.now(),
          sender: 'bot',
          text: data.responseMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioScript: data.audioScript,
          prediction: data.prediction,
          recommendation: data.recommendation,
        };

        setMessages((prev) => [...prev, botMsg]);

        if (onReportCreated && data.parsedIntent) {
          onReportCreated({
            id: data.reportId || 'rep-' + Date.now(),
            farmerId: 'f1',
            farmerName: 'Ramesh Patel',
            farmerPhone: '+91 98234 10001',
            crop: data.parsedIntent.crop,
            quantityKg: data.parsedIntent.quantityKg,
            harvestDate: new Date().toISOString().split('T')[0],
            daysSinceHarvest: data.parsedIntent.daysSinceHarvest,
            storageType: data.parsedIntent.storageType,
            transcript: content,
            detectedLanguage: currentLanguage,
            lat: 20.098,
            lng: 73.918,
            locationName: data.parsedIntent.locationName,
            ambientTempC: data.parsedIntent.ambientTempC,
            ambientHumidityPct: data.parsedIntent.ambientHumidityPct,
            createdAt: new Date().toISOString(),
            status: data.recommendation?.requiresFpoVerification ? 'PENDING_AGENT_VERIFICATION' : 'VERIFIED',
          });
        }
      }
    } catch (err) {
      console.error('Failed to communicate with WhatsApp webhook:', err);
      // Fallback response
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'bot',
          text: '⚠️ Network issue connecting to server. Please try again.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice recording
  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Send simulated audio transcription prompt
      const scenarioText = currentLanguage === 'hi'
        ? `नमस्ते, मैंने 3 दिन पहले 1200 किलो ${selectedCrop === 'tomato' ? 'टमाटर' : selectedCrop === 'banana' ? 'केले' : 'आम'} तोड़े थे। गर्मी 34 डिग्री है, क्रेट में रखे हैं। क्या आज ही बेचना चाहिए?`
        : currentLanguage === 'gu'
        ? `નમસ્તે, 3 દિવસ પહેલાં 1200 કિલો ${selectedCrop === 'tomato' ? 'ટામેટાં' : selectedCrop === 'banana' ? 'કેળાં' : 'કેરી'} ઉતાર્યા હતા. ગરમી છે, શું આજે જ વેચી દેવું?`
        : `Harvested 1,200 kg ${selectedCrop} 3 days ago. Stored in crates in 34°C heat. Should I sell today?`;
      
      handleSendMessage(`🎙️ [Voice Note ${recordingDuration}s]: ${scenarioText}`);
    }
  };

  // Play spoken voice note using browser speech synthesis or Gemini TTS
  const handlePlayVoice = (msg: Message) => {
    if (activeAudioPlayingId === msg.id) {
      window.speechSynthesis.cancel();
      setActiveAudioPlayingId(null);
      return;
    }

    if (!msg.audioScript) return;

    window.speechSynthesis.cancel();
    setActiveAudioPlayingId(msg.id);

    const utterance = new SpeechSynthesisUtterance(msg.audioScript);
    utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'gu' ? 'gu-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setActiveAudioPlayingId(null);
    };

    utterance.onerror = () => {
      setActiveAudioPlayingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      // Ask AI to inspect the photo
      const prompt = currentLanguage === 'hi'
        ? `📷 [फोटो भेजा गया]: कृपया इस कटी हुई फसल की गुणवत्ता, पकने की स्थिति और सड़न के जोखिम की जांच करें।`
        : currentLanguage === 'gu'
        ? `📷 [ફોટો મોકલ્યો]: કૃપા કરીને પાકની ગુણવત્તા અને બગાડના જોખમની તપાસ કરો.`
        : `📷 [Photo Attached]: Please inspect the ripeness and spoilage risk of this harvested crop.`;
      
      await handleSendMessage(prompt, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-7xl mx-auto">
      {/* Left Panel: Persona & Quick Actions */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Quick Language Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Farmer Language
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              Voice-First
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'hi', label: 'हिन्दी' },
              { code: 'gu', label: 'ગુજરાતી' },
              { code: 'en', label: 'English' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code as LanguageCode)}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  currentLanguage === l.code
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click Pilot Test Scenarios */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Pilot Demo Scenarios
            </h3>
          </div>
          <p className="text-xs text-stone-500 mb-3">
            Click to simulate real smallholder farmer voice inquiries from field trials:
          </p>
          <div className="space-y-2.5">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => handleApplyScenario(sc)}
                className="p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-800">
                    {sc.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                    {sc.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{sc.location}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="text-[11px] text-stone-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SDG 12.3 Compliant Engine</span>
              </div>
              <p className="text-[10px] text-stone-400">
                Returns verifiable buyer routes, cold-chain capacity, and loss-avoidance calculations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center: WhatsApp Phone Frame */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md bg-stone-900 rounded-[38px] p-2.5 shadow-2xl border-4 border-stone-800 flex flex-col h-[720px]">
          {/* Phone Speaker Notch */}
          <div className="w-full flex justify-center py-1">
            <div className="w-24 h-4 bg-stone-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-stone-950 mr-2" />
              <div className="w-10 h-1 bg-stone-700 rounded-full" />
            </div>
          </div>

          {/* WhatsApp Interface Screen */}
          <div className="flex-1 bg-[#efeae2] rounded-[30px] flex flex-col overflow-hidden relative">
            {/* WhatsApp Top App Bar */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-lg overflow-hidden relative">
                  <span>🌾</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm tracking-tight">HarvestSaver AI</h2>
                    <span className="w-3.5 h-3.5 bg-emerald-400 text-[#075e54] rounded-full flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Online • Krishi Sahayak
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-emerald-100 text-xs font-medium">
                <span className="bg-[#128c7e] px-2 py-0.5 rounded-md text-[11px] font-mono">
                  {currentLanguage.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[radial-gradient(#075e54_0.4px,transparent_0.4px)] [background-size:16px_16px] [background-color:#eae6df]">
              {messages.map((m) => {
                const isUser = m.sender === 'farmer';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 shadow-xs relative text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#d9fdd3] text-stone-900 rounded-tr-none'
                          : 'bg-white text-stone-900 rounded-tl-none border border-stone-200/50'
                      }`}
                    >
                      {/* Image Preview if sent */}
                      {m.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                          <img
                            src={m.imageUrl}
                            alt="Crop harvest preview"
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      )}

                      {/* Main Message Text */}
                      <div className="whitespace-pre-line font-sans text-stone-800">
                        {m.text}
                      </div>

                      {/* Audio Note Bar if available */}
                      {m.audioScript && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handlePlayVoice(m)}
                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-colors"
                          >
                            {activeAudioPlayingId === m.id ? (
                              <>
                                <Pause className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                <span>Playing Voice Advice...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  {currentLanguage === 'hi'
                                    ? 'वॉयस नोट सुनें'
                                    : currentLanguage === 'gu'
                                    ? 'વૉઇસ નોટ સાંભળો'
                                    : 'Listen Voice Note'}
                                </span>
                              </>
                            )}
                          </button>
                          <span className="text-[10px] text-stone-400 font-mono">0:14</span>
                        </div>
                      )}

                      {/* Action CTA Buttons (WhatsApp Interactive Buttons) */}
                      {m.recommendation && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-col gap-1.5">
                          {m.recommendation.buyer && (
                            <a
                              href={`tel:${m.recommendation.buyer.contactPhone}`}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>
                                {currentLanguage === 'hi'
                                  ? `खरीदार को कॉल करें: ${m.recommendation.buyer.name}`
                                  : currentLanguage === 'gu'
                                  ? `વેપારીને કૉલ કરો: ${m.recommendation.buyer.name}`
                                  : `Call Buyer: ${m.recommendation.buyer.name}`}
                              </span>
                            </a>
                          )}

                          {m.recommendation.coldStorage && (
                            <div className="w-full py-1.5 bg-sky-50 text-sky-800 rounded-lg text-center font-medium text-[11px] flex items-center justify-center gap-1.5 border border-sky-200">
                              <Snowflake className="w-3 h-3 text-sky-600" />
                              <span>
                                {currentLanguage === 'hi'
                                  ? `कोल्ड स्टोर बुक करें (${m.recommendation.coldStorage.distanceKm} किमी)`
                                  : currentLanguage === 'gu'
                                  ? `કોલ્ડ સ્ટોરેજ બુક કરો`
                                  : `Reserve Space (${m.recommendation.coldStorage.distanceKm} km)`}
                              </span>
                            </div>
                          )}

                          {m.recommendation.processor && (
                            <div className="w-full py-1.5 bg-amber-50 text-amber-900 rounded-lg text-center font-medium text-[11px] flex items-center justify-center gap-1.5 border border-amber-200">
                              <Factory className="w-3 h-3 text-amber-700" />
                              <span>
                                {currentLanguage === 'hi'
                                  ? `प्रोसेसिंग सेंटर रूट (${m.recommendation.processor.name})`
                                  : currentLanguage === 'gu'
                                  ? `પ્રોસેસિંગ સેન્ટર રૂટ`
                                  : `Dispatch to Processor`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamp & read receipts */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-400">
                        <span>{m.timestamp}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-xs border border-stone-200 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-stone-500 font-medium ml-1">
                      {currentLanguage === 'hi'
                        ? 'कृषि मॉडल विश्लेषण कर रहा है...'
                        : currentLanguage === 'gu'
                        ? 'વિશ્લેષણ થઈ રહ્યું છે...'
                        : 'HarvestSaver AI analyzing...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar: Input & Voice Note */}
            <div className="bg-[#f0f2f5] p-2 border-t border-stone-200 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-stone-600 hover:text-emerald-700 hover:bg-stone-200 rounded-full transition-colors"
                title="Send harvest photo for ripeness and defect inspection"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 flex items-center border border-stone-300 focus-within:border-emerald-600 transition-colors shadow-2xs">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    currentLanguage === 'hi'
                      ? 'फसल, वजन या दिन लिखें...'
                      : currentLanguage === 'gu'
                      ? 'પાકની વિગત લખો...'
                      : 'Type crop, qty, or harvest date...'
                  }
                  className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent outline-none"
                />
              </div>

              {inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${
                    isRecording
                      ? 'bg-red-600 animate-pulse scale-110 shadow-md'
                      : 'bg-[#00a884] hover:bg-emerald-600 shadow-xs'
                  }`}
                  title={isRecording ? 'Click to send voice note' : 'Click to record voice note'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Recording banner overlay */}
            {isRecording && (
              <div className="absolute bottom-14 left-4 right-4 bg-red-600 text-white rounded-xl px-3 py-2 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span className="text-xs font-bold">Recording Voice Note... ({recordingDuration}s)</span>
                </div>
                <button
                  onClick={handleToggleRecord}
                  className="text-xs font-semibold bg-white text-red-700 px-2.5 py-1 rounded-md"
                >
                  Send Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
