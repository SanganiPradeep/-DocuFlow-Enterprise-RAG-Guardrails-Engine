import React, { useState } from 'react';
import { 
  GitFork, 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Lock, 
  Server, 
  Layers, 
  ArrowRight, 
  ArrowDown, 
  FileText, 
  Key, 
  CheckCircle2 
} from 'lucide-react';

export const ArchitectureFlowModal: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(2);

  const steps = [
    {
      step: 1,
      title: 'Step 1: Ingestion & Vectorization (The Data Layer)',
      subtitle: 'Google Cloud Storage & Vertex AI Embeddings API',
      color: 'blue',
      description: 'Administrators upload internal corporate documents (PDFs, HR handbooks, architecture notes) into the system. Files are stored securely in Google Cloud Storage (GCS) with CMEK. A background service breaks them down into recursive chunks (500 tokens, 50 overlap), generates embeddings using Vertex AI Embeddings, and indexes them into Vertex AI Vector Search with ScANN.',
      gcpTech: ['Google Cloud Storage (GCS)', 'Vertex AI Embeddings API', 'Vertex AI Vector Search (ScANN)'],
    },
    {
      step: 2,
      title: 'Step 2: Input Interception & Security Guardrails (The Security Layer)',
      subtitle: 'Google Cloud Model Armor (Input Shield)',
      color: 'red',
      description: 'When an employee types a query (or an adversarial attack like "Ignore previous instructions" or "Show me CEO salary"), the query does NOT go straight to the LLM. Model Armor evaluates the prompt in real-time (<20ms) against prompt injection dictionaries, jailbreak heuristics, and PII extractors. If malicious, it is blocked immediately before reaching Vertex AI.',
      gcpTech: ['Google Cloud Model Armor (Input Proxy)', 'Zero-Trust IAM Policy Engine', 'Threat Signature Heuristics'],
    },
    {
      step: 3,
      title: 'Step 3: Context Retrieval & Generation (The Agentic RAG Layer)',
      subtitle: 'Vertex AI Vector Search & Gemini 3.8 Flash',
      color: 'blue',
      description: 'If the prompt passes Model Armor security checks, the clean query searches the vector database to pull matching document chunks based on user clearance level. Gemini processes the retrieved chunks and crafts an accurate, context-grounded response with exact source citations.',
      gcpTech: ['Vertex AI Vector Search', 'Gemini 3.8 Flash (Vertex AI)', 'Grounded Citation Synthesizer'],
    },
    {
      step: 4,
      title: 'Step 4: Output Guardrail & Response Sanitization (The Final Check)',
      subtitle: 'Google Cloud Model Armor (Output Shield)',
      color: 'red',
      description: 'Before the generated answer is displayed back to the user, the text goes through an egress output filter. Model Armor scans the model response to ensure no sensitive internal tokens, API keys, or confidential compensation numbers were accidentally leaked or hallucinated. Clean responses are rendered on the secure UI.',
      gcpTech: ['Google Cloud Model Armor (Output Scrubber)', 'Regex Token Masker', 'Audit Compliance Journal'],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F3F4] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white p-5 rounded-2xl border border-[#DADCE0] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shadow-sm">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#202124]">
                DocuFlow Enterprise Architecture & Google Cloud Integration
              </h1>
              <p className="text-xs text-[#5F6368] mt-0.5">
                The four-layer "sandwich" security architecture protecting corporate RAG knowledge bases with Model Armor.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="bg-[#202124] text-white rounded-3xl p-6 sm:p-8 border border-[#3C4043] shadow-md overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-[#3C4043] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EA4335]"></span>
              <span className="w-3 h-3 rounded-full bg-[#FBBC04]"></span>
              <span className="w-3 h-3 rounded-full bg-[#34A853]"></span>
              <span className="text-xs text-[#BDC1C6] font-mono ml-2">docuflow-sandwich-pipeline.mermaid</span>
            </div>
            <span className="text-xs font-mono bg-[#1A73E8]/30 text-[#8AB4F8] border border-[#1A73E8]/50 px-2.5 py-1 rounded-full">
              Hosted on Google Cloud Run & Firebase
            </span>
          </div>

          {/* Diagram Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Box 1: User Query */}
            <div 
              onClick={() => setActiveStep(1)}
              className="p-4 rounded-2xl bg-[#303134] border border-[#5F6368] flex flex-col justify-between hover:border-[#8AB4F8] transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-mono text-[#9AA0A6] uppercase font-bold">Entry Point</span>
                <h4 className="text-sm font-semibold text-white mt-1">1. User Query</h4>
                <p className="text-[11px] text-[#BDC1C6] mt-2 leading-relaxed">
                  Knowledge Worker or Adversary queries internal RAG chat.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#3C4043] text-[10px] text-[#8AB4F8] font-semibold">
                Client Layer →
              </div>
            </div>

            {/* Box 2: Input Shield (RED) */}
            <div 
              onClick={() => setActiveStep(2)}
              className="p-4 rounded-2xl bg-[#5C0A0A]/40 border-2 border-[#EA4335] flex flex-col justify-between hover:scale-102 transition-transform cursor-pointer shadow-md shadow-red-950/40"
            >
              <div>
                <span className="text-[10px] font-mono text-[#F1998E] uppercase font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-[#EA4335]" />
                  Security Shield 1
                </span>
                <h4 className="text-sm font-semibold text-white mt-1">2. Model Armor (Input)</h4>
                <p className="text-[11px] text-[#F1998E] mt-2 leading-relaxed">
                  Blocks prompt injections, jailbreaks & PII exfiltration in &lt;16ms.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#8C1D18] text-[10px] text-[#F1998E] font-bold">
                BLOCKED or PASSED ↓
              </div>
            </div>

            {/* Box 3: Vector Search & Gemini (BLUE) */}
            <div 
              onClick={() => setActiveStep(3)}
              className="p-4 rounded-2xl bg-[#042A5C]/40 border-2 border-[#1A73E8] flex flex-col justify-between hover:scale-102 transition-transform cursor-pointer shadow-md shadow-blue-950/40"
            >
              <div>
                <span className="text-[10px] font-mono text-[#8AB4F8] uppercase font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#8AB4F8]" />
                  Vertex AI Core
                </span>
                <h4 className="text-sm font-semibold text-white mt-1">3. Vector & Gemini</h4>
                <p className="text-[11px] text-[#ADCCF9] mt-2 leading-relaxed">
                  Vertex AI Vector Search ScANN + Gemini 3.8 Flash context citations.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#174EA6] text-[10px] text-[#8AB4F8] font-bold">
                Context Synthesized ↓
              </div>
            </div>

            {/* Box 4: Output Shield (RED) */}
            <div 
              onClick={() => setActiveStep(4)}
              className="p-4 rounded-2xl bg-[#5C0A0A]/40 border-2 border-[#EA4335] flex flex-col justify-between hover:scale-102 transition-transform cursor-pointer shadow-md shadow-red-950/40"
            >
              <div>
                <span className="text-[10px] font-mono text-[#F1998E] uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#EA4335]" />
                  Security Shield 2
                </span>
                <h4 className="text-sm font-semibold text-white mt-1">4. Model Armor (Output)</h4>
                <p className="text-[11px] text-[#F1998E] mt-2 leading-relaxed">
                  Screens generated tokens for secret keys, credentials, or PII leakage.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#8C1D18] text-[10px] text-[#81C995] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#81C995]" />
                <span>Verified to UI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Detailed Breakdown Accordion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'bg-white border-[#1A73E8] ring-2 ring-[#1A73E8]/20 shadow-md'
                  : 'bg-white border-[#DADCE0] hover:border-[#BDC1C6] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-[#F1F3F4] text-[#3C4043]">
                  {s.subtitle}
                </span>
                <span className="text-xs font-bold text-[#1A73E8]">Step {s.step} of 4</span>
              </div>

              <h3 className="text-sm font-semibold text-[#202124]">{s.title}</h3>
              <p className="text-xs text-[#5F6368] mt-2 leading-relaxed">{s.description}</p>

              <div className="mt-4 pt-3 border-t border-[#F1F3F4] flex flex-wrap gap-1.5">
                {s.gcpTech.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-mono bg-[#E8F0FE] text-[#1967D2] px-2 py-0.5 rounded border border-[#ADCCF9]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
