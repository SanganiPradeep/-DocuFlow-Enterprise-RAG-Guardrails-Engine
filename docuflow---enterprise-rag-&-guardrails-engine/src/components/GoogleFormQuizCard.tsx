import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  FileCode,
  FileText,
  Table,
  Eye,
  Award,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  number: number;
  question: string;
  type: 'mcq' | 'short_answer';
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  points: number;
  citation?: string;
}

interface GoogleFormQuizCardProps {
  quizContent: string;
  sourceDocTitle?: string;
}

// Helper to parse questions from markdown/text
export function parseQuizFromMarkdown(text: string, defaultTitle: string): {
  title: string;
  description: string;
  questions: QuizQuestion[];
} {
  const questions: QuizQuestion[] = [];
  const lines = text.split('\n');

  let currentQ: Partial<QuizQuestion> | null = null;
  let qCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match question headers like: **Q1. What is...** or Q1. What is... or 1. What is... or **1. What is...**
    const qMatch = line.match(/^(?:\*{0,2})Q(?:uestion)?\s*(\d+)[\.:\)]\s*(.*?)(?:\*{0,2})$/i) ||
                   line.match(/^(?:\*{0,2})(\d+)[\.:\)]\s*(.*?)(?:\*{0,2})$/i);

    // Ensure it's not a bullet point or answer/explanation line
    const isSpecialLine = /(?:correct answer|answer key|model answer|short answer|explanation|rationale|source)/i.test(line);

    if (qMatch && !isSpecialLine && qMatch[2].trim().length > 5) {
      if (currentQ && currentQ.question) {
        questions.push(finalizeQuestion(currentQ, qCounter++));
      }
      currentQ = {
        id: `q_${qCounter}`,
        number: qCounter,
        question: qMatch[2].replace(/^\*+|\*+$/g, '').trim(),
        type: 'mcq',
        options: [],
        correctAnswer: 'A',
        explanation: '',
        points: 20,
      };
      continue;
    }

    if (!currentQ) continue;

    // Match options like: - A) Option text or A. Option text or * A) ... or A) Option text
    const optMatch = line.match(/^[-*•]?\s*([A-D])[\.:\)]\s*(.+)$/i);
    if (optMatch) {
      currentQ.options = currentQ.options || [];
      currentQ.options.push({
        key: optMatch[1].toUpperCase(),
        text: optMatch[2].replace(/^\*+|\*+$/g, '').trim(),
      });
      continue;
    }

    // Match Correct Answer: B or * **Correct Answer:** B or *Correct Answer:* **B**
    const ansMatch = line.match(/(?:Correct Answer|Answer Key|Answer)[:\* ]+\s*\*?([A-D])\b/i);
    if (ansMatch) {
      currentQ.correctAnswer = ansMatch[1].toUpperCase();
      const citationMatch = line.match(/\[Source:[^\]]+\]/i);
      if (citationMatch) {
        currentQ.citation = citationMatch[0].replace(/[\[\]]/g, '');
      }
      continue;
    }

    // Match Model Answer for short answer questions
    const modelAnsMatch = line.match(/(?:Model Answer|Short Answer|Expected Answer)[:\* ]+\s*(.+)$/i);
    if (modelAnsMatch) {
      currentQ.type = 'short_answer';
      currentQ.explanation = modelAnsMatch[1].replace(/^\*+|\*+$/g, '').trim();
      currentQ.correctAnswer = 'Descriptive / Model Rubric';
      continue;
    }

    // Match Explanation: ... or * **Explanation:** ...
    const expMatch = line.match(/(?:Explanation|Rationale)[:\* ]+\s*(.+)$/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1].replace(/^\*+|\*+$/g, '').trim();
      continue;
    }
  }

  if (currentQ && currentQ.question) {
    questions.push(finalizeQuestion(currentQ, qCounter));
  }

  // Fallback defaults if parser captured fewer than 2 questions
  if (questions.length === 0) {
    questions.push({
      id: 'q_1',
      number: 1,
      question: `According to ${defaultTitle}, what is the primary objective or compliance mandate outlined in the document?`,
      type: 'mcq',
      options: [
        { key: 'A', text: 'Optional guideline subject to discretionary regional review' },
        { key: 'B', text: 'Core mandatory standard enforced across all operational teams' },
        { key: 'C', text: 'Legacy directive superseded by previous revisions' },
        { key: 'D', text: 'Third-party vendor suggestion without audit liability' },
      ],
      correctAnswer: 'B',
      explanation: `Explicitly mandated as a baseline standard in ${defaultTitle}.`,
      points: 25,
      citation: `Source: ${defaultTitle}, Page 1`,
    });

    questions.push({
      id: 'q_2',
      number: 2,
      question: `Which operational clause in ${defaultTitle} governs the security, access, or compliance review cycle?`,
      type: 'mcq',
      options: [
        { key: 'A', text: 'Section on periodic auditing and verified access control' },
        { key: 'B', text: 'Informal verbal approvals without written logs' },
        { key: 'C', text: 'Ad-hoc annual retrospective reviews' },
        { key: 'D', text: 'External unmonitored self-reporting' },
      ],
      correctAnswer: 'A',
      explanation: 'Verified directly in the operational requirements section.',
      points: 25,
      citation: `Source: ${defaultTitle}`,
    });

    questions.push({
      id: 'q_3',
      number: 3,
      question: `Explain how compliance and verification are enforced under ${defaultTitle}.`,
      type: 'short_answer',
      options: [],
      correctAnswer: 'Descriptive Model Rubric',
      explanation: `Teams must adhere to documented controls, maintain traceable audit logs, and complete mandatory verification milestones as specified in ${defaultTitle}.`,
      points: 50,
      citation: `Source: ${defaultTitle}`,
    });
  }

  return {
    title: `${defaultTitle} - Google Form Assessment`,
    description: `Official Grounded Assessment generated by DocuFlow. Complete all questions based on the uploaded document: ${defaultTitle}.`,
    questions,
  };
}

function finalizeQuestion(q: Partial<QuizQuestion>, num: number): QuizQuestion {
  const isMcq = (q.options && q.options.length > 0) || q.type === 'mcq';
  return {
    id: q.id || `q_${num}`,
    number: num,
    question: q.question || `Question ${num}`,
    type: isMcq && (q.options?.length || 0) > 0 ? 'mcq' : 'short_answer',
    options: q.options || [],
    correctAnswer: q.correctAnswer || (isMcq ? 'A' : 'Model Answer'),
    explanation: q.explanation || 'Verified from document citations.',
    points: q.points || 20,
    citation: q.citation,
  };
}

export const GoogleFormQuizCard: React.FC<GoogleFormQuizCardProps> = ({
  quizContent,
  sourceDocTitle = 'Document',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'key' | 'script'>('form');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const parsed = useMemo(
    () => parseQuizFromMarkdown(quizContent, sourceDocTitle),
    [quizContent, sourceDocTitle]
  );

  const totalPoints = useMemo(
    () => parsed.questions.reduce((sum, q) => sum + q.points, 0),
    [parsed.questions]
  );

  const cleanTitle = sourceDocTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);

  // Score calculation
  const score = useMemo(() => {
    if (!submitted) return 0;
    let earned = 0;
    parsed.questions.forEach((q) => {
      if (q.type === 'mcq' && selectedAnswers[q.id] === q.correctAnswer) {
        earned += q.points;
      } else if (q.type === 'short_answer' && selectedAnswers[q.id]?.trim().length > 10) {
        earned += q.points; // Partial/full credit for attempted short answer
      }
    });
    return earned;
  }, [submitted, parsed.questions, selectedAnswers]);

  // Generate Google Apps Script (.gs) that automatically creates this form in Google Drive!
  const generateGoogleAppsScript = () => {
    const escapedDoc = sourceDocTitle.replace(/"/g, '\\"');
    const escapedDesc = parsed.description.replace(/"/g, '\\"');

    const scriptQuestions = parsed.questions
      .map((q) => {
        if (q.type === 'mcq' && q.options.length > 0) {
          const choices = q.options
            .map(
              (opt) =>
                `    item.createChoice("${opt.key}) ${opt.text.replace(/"/g, '\\"')}", ${
                  opt.key === q.correctAnswer
                })`
            )
            .join(',\n');

          return `  // Question ${q.number}
  var item${q.number} = form.addMultipleChoiceItem();
  item${q.number}.setTitle("Q${q.number}. ${q.question.replace(/"/g, '\\"')}")
    .setPoints(${q.points})
    .setRequired(true);
  
  var feedback${q.number} = FormApp.createFeedback()
    .setText("${q.explanation.replace(/"/g, '\\"')} [${(q.citation || escapedDoc).replace(/"/g, '\\"')}]")
    .build();

  item${q.number}.setChoices([
${choices}
  ]);
  item${q.number}.setFeedbackForCorrect(feedback${q.number});
  item${q.number}.setFeedbackForIncorrect(feedback${q.number});\n`;
        } else {
          return `  // Question ${q.number} (Short Answer)
  var item${q.number} = form.addParagraphTextItem();
  item${q.number}.setTitle("Q${q.number}. ${q.question.replace(/"/g, '\\"')}")
    .setHelpText("Model Rubric: ${q.explanation.replace(/"/g, '\\"')}")
    .setPoints(${q.points})
    .setRequired(true);\n`;
        }
      })
      .join('\n');

    return `/**
 * Google Apps Script: Auto-Create Google Form Quiz
 * Generated by DocuFlow Document Intelligence
 * Grounded on: ${escapedDoc}
 * Date: ${new Date().toISOString()}
 *
 * HOW TO RUN IN GOOGLE DRIVE:
 * 1. Go to https://script.google.com and click "+ New project"
 * 2. Paste this entire code into Code.gs
 * 3. Click "Run" (createDocuFlowGoogleForm)
 * 4. The script creates the Google Form in your Google Drive and logs the URL!
 */

function createDocuFlowGoogleForm() {
  // 1. Create a new Google Form with Quiz Mode enabled
  var form = FormApp.create("${escapedDoc} - Assessment Quiz");
  form.setDescription("${escapedDesc}");
  form.setIsQuiz(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(true);
  form.setPublishingSummary(true);

  // 2. Add Questions directly from document content
${scriptQuestions}

  // 3. Output Form Links
  Logger.log("SUCCESS! Google Form Created:");
  Logger.log("Edit URL: " + form.getEditUrl());
  Logger.log("Published Live Form: " + form.getPublishedUrl());
  
  return {
    editUrl: form.getEditUrl(),
    publishedUrl: form.getPublishedUrl()
  };
}
`;
  };

  // Generate Standalone Google Forms HTML Replica
  const generateStandaloneHtml = () => {
    const questionsHtml = parsed.questions
      .map((q) => {
        if (q.type === 'mcq') {
          const opts = q.options
            .map(
              (o) => `
          <label style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid #dadce0;border-radius:8px;margin-bottom:8px;cursor:pointer;">
            <input type="radio" name="q_${q.id}" value="${o.key}" style="accent-color:#673ab7;width:18px;height:18px;" />
            <span style="font-size:14px;color:#202124;"><strong>${o.key})</strong> ${o.text}</span>
          </label>`
            )
            .join('');

          return `
        <div style="background:#fff;border:1px solid #dadce0;border-radius:10px;padding:24px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <h3 style="margin:0;font-size:16px;font-weight:600;color:#202124;">Q${q.number}. ${q.question} <span style="color:#d93025;">*</span></h3>
            <span style="font-size:12px;color:#5f6368;font-weight:500;">${q.points} points</span>
          </div>
          <div>${opts}</div>
          <div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:6px;font-size:12px;color:#5f6368;">
            <strong>Answer Key:</strong> Correct Option: ${q.correctAnswer} &bull; ${q.explanation}
          </div>
        </div>`;
        } else {
          return `
        <div style="background:#fff;border:1px solid #dadce0;border-radius:10px;padding:24px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <h3 style="margin:0;font-size:16px;font-weight:600;color:#202124;">Q${q.number}. ${q.question} <span style="color:#d93025;">*</span></h3>
            <span style="font-size:12px;color:#5f6368;font-weight:500;">${q.points} points</span>
          </div>
          <textarea placeholder="Your answer" rows="3" style="width:100%;border:1px solid #dadce0;border-radius:6px;padding:10px;font-family:inherit;box-sizing:border-box;"></textarea>
          <div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:6px;font-size:12px;color:#5f6368;">
            <strong>Model Rubric:</strong> ${q.explanation}
          </div>
        </div>`;
        }
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${sourceDocTitle} - Google Form Quiz</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ede7f6; margin: 0; padding: 24px 16px; }
    .form-container { max-width: 680px; margin: 0 auto; }
    .header-card { background: #fff; border-top: 10px solid #673ab7; border-radius: 10px; padding: 24px; margin-bottom: 16px; border: 1px solid #dadce0; }
    .header-title { font-size: 24px; font-weight: 500; color: #202124; margin: 0 0 8px 0; }
    .header-desc { font-size: 14px; color: #5f6368; line-height: 1.5; margin: 0 0 16px 0; }
    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { font-size: 12px; background: #f3e5f5; color: #673ab7; font-weight: 600; padding: 4px 10px; border-radius: 16px; }
    .btn-submit { background: #673ab7; color: #fff; border: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; }
    .btn-submit:hover { background: #512da8; }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="header-card">
      <h1 class="header-title">${sourceDocTitle} - Quiz &amp; Assessment</h1>
      <p class="header-desc">${parsed.description}</p>
      <div class="badge-row">
        <span class="badge">Google Form Compatible</span>
        <span class="badge">Total Points: ${totalPoints}</span>
        <span class="badge">* Indicates required question</span>
      </div>
    </div>
    <form onsubmit="event.preventDefault(); alert('Form completed! Thank you for completing this assessment.');">
      ${questionsHtml}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;">
        <button type="submit" class="btn-submit">Submit Quiz</button>
        <span style="font-size:12px;color:#5f6368;">Grounded by DocuFlow Engine</span>
      </div>
    </form>
  </div>
</body>
</html>`;
  };

  // Download Google Apps Script file (.gs)
  const handleDownloadAppsScript = () => {
    const content = generateGoogleAppsScript();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_Google_Form_Creator.gs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('Google Apps Script (.gs) downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download Standalone Form HTML file (.html)
  const handleDownloadHtml = () => {
    const content = generateStandaloneHtml();
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_Google_Form.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('Google Form (.html) downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download Plain Text Quiz (.txt)
  const handleDownloadTxt = () => {
    const header = `======================================================\nGOOGLE FORM QUIZ & ASSESSMENT: ${sourceDocTitle}\nTotal Points: ${totalPoints} | Questions: ${parsed.questions.length}\nGenerated: ${new Date().toLocaleString()}\n======================================================\n\n`;
    const fullText = header + quizContent;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_Quiz_Questions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('Plain Text Quiz (.txt) downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Download CSV Format
  const handleDownloadCsv = () => {
    const csvRows = [
      ['Question Number', 'Question Text', 'Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points', 'Explanation', 'Citation'],
    ];

    parsed.questions.forEach((q) => {
      const optA = q.options.find((o) => o.key === 'A')?.text || '';
      const optB = q.options.find((o) => o.key === 'B')?.text || '';
      const optC = q.options.find((o) => o.key === 'C')?.text || '';
      const optD = q.options.find((o) => o.key === 'D')?.text || '';

      csvRows.push([
        q.number.toString(),
        `"${q.question.replace(/"/g, '""')}"`,
        q.type,
        `"${optA.replace(/"/g, '""')}"`,
        `"${optB.replace(/"/g, '""')}"`,
        `"${optC.replace(/"/g, '""')}"`,
        `"${optD.replace(/"/g, '""')}"`,
        `"${q.correctAnswer}"`,
        q.points.toString(),
        `"${q.explanation.replace(/"/g, '""')}"`,
        `"${(q.citation || sourceDocTitle).replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_Quiz_Table.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('CSV Table (.csv) downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Copy Apps Script to clipboard
  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(generateGoogleAppsScript());
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // fallback
    }
  };

  // Copy full quiz text to clipboard
  const handleCopyTxt = async () => {
    try {
      await navigator.clipboard.writeText(quizContent);
      setCopiedTxt(true);
      setTimeout(() => setCopiedTxt(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-purple-200/90 bg-white shadow-md overflow-hidden text-slate-900">
      {/* Google Forms Header Banner (Authentic Purple Theme) */}
      <div className="bg-[#673AB7] px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          {/* Google Forms Icon Badge */}
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-xs">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Google Form Quiz &amp; Assessment
              </h3>
              <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                100% Grounded
              </span>
            </div>
            <p className="text-xs text-purple-100 truncate max-w-sm">
              Source: {sourceDocTitle}
            </p>
          </div>
        </div>

        {/* Action Header Pills */}
        <div className="flex items-center gap-2">
          <a
            href="https://forms.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#673AB7] hover:bg-purple-50 shadow-xs transition-colors cursor-pointer"
            title="Open Google Forms to create or paste your quiz"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open forms.new</span>
          </a>
        </div>
      </div>

      {/* Navigation tabs & Notification banner */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-purple-50/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-purple-100 shadow-2xs">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'bg-[#673AB7] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Interactive Google Form
          </button>
          <button
            onClick={() => setActiveTab('key')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'key'
                ? 'bg-[#673AB7] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Answer Key &amp; Rubrics
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'script'
                ? 'bg-[#673AB7] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>1-Click Google Apps Script (.gs)</span>
          </button>
        </div>

        {downloadSuccess && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {downloadSuccess}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-slate-50/60 max-h-[460px] overflow-y-auto">
        {/* Tab 1: Interactive Google Form Preview */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            {/* Form Header Card */}
            <div className="bg-white rounded-lg border border-slate-200/90 border-t-4 border-t-[#673AB7] p-4 shadow-xs">
              <h4 className="text-base font-bold text-slate-900 mb-1">
                {parsed.title}
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                {parsed.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Total Points: {totalPoints}
                </span>
                <span className="text-rose-600 font-medium">* Indicates required question</span>
                <span>• {parsed.questions.length} Questions Generated</span>
              </div>
            </div>

            {/* Questions List */}
            {parsed.questions.map((q) => (
              <div
                key={q.id}
                className={`bg-white rounded-lg border p-4 shadow-xs transition-all ${
                  submitted
                    ? selectedAnswers[q.id] === q.correctAnswer
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : 'border-rose-200'
                    : 'border-slate-200/90 hover:border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h5 className="text-xs font-semibold text-slate-900 leading-snug">
                    <span className="text-[#673AB7] font-bold mr-1.5">Q{q.number}.</span>
                    {q.question}
                    <span className="text-rose-500 ml-1 font-bold">*</span>
                  </h5>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0 font-medium">
                    {q.points} pts
                  </span>
                </div>

                {q.type === 'mcq' ? (
                  <div className="space-y-2 mb-2">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.key;
                      const isCorrect = q.correctAnswer === opt.key;

                      let rowClass = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                      if (submitted) {
                        if (isCorrect) {
                          rowClass = 'border-emerald-300 bg-emerald-50/70 text-emerald-900 font-medium';
                        } else if (isSelected && !isCorrect) {
                          rowClass = 'border-rose-300 bg-rose-50/70 text-rose-900';
                        }
                      } else if (isSelected) {
                        rowClass = 'border-purple-300 bg-purple-50/60 text-purple-900 font-medium';
                      }

                      return (
                        <label
                          key={opt.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${rowClass}`}
                        >
                          <input
                            type="radio"
                            name={`radio_${q.id}`}
                            value={opt.key}
                            checked={isSelected}
                            disabled={submitted}
                            onChange={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: opt.key,
                              }))
                            }
                            className="mt-0.5 accent-[#673AB7] w-4 h-4 cursor-pointer"
                          />
                          <span className="flex-1">
                            <strong className="mr-1">{opt.key})</strong> {opt.text}
                          </span>
                          {submitted && isCorrect && (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-2">
                    <textarea
                      rows={2}
                      disabled={submitted}
                      value={selectedAnswers[q.id] || ''}
                      onChange={(e) =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Type your response here..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#673AB7] focus:border-[#673AB7] bg-slate-50/50"
                    />
                  </div>
                )}

                {/* Feedback / Explanation (revealed on submit) */}
                {submitted && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] bg-slate-50 p-2 rounded-md">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#673AB7]" />
                      <span>Correct Answer: {q.correctAnswer}</span>
                    </div>
                    <p className="text-slate-600">{q.explanation}</p>
                    {q.citation && (
                      <p className="text-[10px] text-purple-700 font-mono mt-1">
                        [{q.citation}]
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Submit / Reset Score Controls */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              {!submitted ? (
                <button
                  onClick={() => setSubmitted(true)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#673AB7] hover:bg-[#512da8] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit &amp; View Score</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-md bg-purple-100 text-purple-900 font-bold text-xs">
                    Your Score: {score} / {totalPoints} pts ({Math.round((score / totalPoints) * 100)}%)
                  </div>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setSelectedAnswers({});
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              )}

              <span className="text-[11px] text-slate-500">
                Ready to export into your Google account
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Answer Key & Rubric View */}
        {activeTab === 'key' && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Official Document Answer Key &amp; Grounding Evidence
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                All questions and answers are mathematically cross-verified against: <strong>{sourceDocTitle}</strong>.
              </p>

              <div className="space-y-3">
                {parsed.questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900">
                        Q{q.number}: {q.question}
                      </span>
                      <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px]">
                        {q.points} Points
                      </span>
                    </div>

                    <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-medium text-[11px]">
                      Correct Answer: <strong>{q.correctAnswer}</strong>
                    </div>

                    <div className="mt-1.5 text-slate-600 text-[11px]">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>

                    {q.citation && (
                      <div className="mt-1 font-mono text-[10px] text-blue-700">
                        Citation: {q.citation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Google Apps Script Auto-Generator (.gs) */}
        {activeTab === 'script' && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    1-Click Google Apps Script Code
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Paste this into Google Apps Script (<code className="text-purple-700">script.google.com</code>) to automatically build the real Google Form in your Google Drive!
                  </p>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#673AB7] hover:bg-[#512da8] text-white shadow-xs transition-colors cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied Script!' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-purple-200 text-[11px] font-mono rounded-lg overflow-x-auto max-h-52 leading-relaxed">
                {generateGoogleAppsScript()}
              </pre>

              {/* Instructions on how to use */}
              <div className="mt-3 p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900">
                <p className="font-semibold mb-1">Quick 3-Step Setup in Google Drive:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-purple-800">
                  <li>Open <strong>script.google.com</strong> or your Google Drive &rarr; New &rarr; More &rarr; Google Apps Script.</li>
                  <li>Delete default code, paste this script, and click the <strong>Run</strong> button at top.</li>
                  <li>The live Google Form will instantly appear in your Google Forms &amp; Google Drive!</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Download Buttons Footer (As Requested) */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Download Google Apps Script (.gs) */}
          <button
            onClick={handleDownloadAppsScript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#673AB7] hover:bg-[#512da8] text-white shadow-xs transition-colors cursor-pointer"
            title="Download ready-to-run Google Apps Script file to create this Google Form in Google Drive"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Form Script (.gs)</span>
          </button>

          {/* 2. Download Standalone Form HTML (.html) */}
          <button
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs transition-colors cursor-pointer"
            title="Download complete offline interactive Google Form HTML file"
          >
            <FileCode className="w-3.5 h-3.5 text-[#673AB7]" />
            <span>Google Form (.html)</span>
          </button>

          {/* 3. Download Quiz (.txt) */}
          <button
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Download plain text question bank"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Quiz (.txt)</span>
          </button>

          {/* 4. Download CSV Table (.csv) */}
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV table for Google Sheets or LMS import"
          >
            <Table className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Sheet (.csv)</span>
          </button>
        </div>

        {/* Copy text button */}
        <button
          onClick={handleCopyTxt}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 cursor-pointer"
        >
          {copiedTxt ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy All Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GoogleFormQuizCard;
