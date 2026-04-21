import { jsPDF } from "jspdf";

const addSectionTitle = (doc, title, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, y);
  return y + 8;
};

const addParagraph = (doc, text, y, options = {}) => {
  const value = String(text || "").trim();
  if (!value) return y;
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(options.fontSize || 10);
  const lines = doc.splitTextToSize(value, 180);
  doc.text(lines, 14, y);
  return y + lines.length * 5 + 3;
};

const addBulletList = (doc, items, y) => {
  const normalized = (items || []).filter(Boolean);
  if (!normalized.length) {
    return addParagraph(doc, "Not available.", y);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  normalized.forEach((item) => {
    const lines = doc.splitTextToSize(`- ${item}`, 176);
    doc.text(lines, 16, y);
    y += lines.length * 5 + 2;
  });
  return y + 1;
};

const ensurePageSpace = (doc, y, required = 20) => {
  if (y > 280 - required) {
    doc.addPage();
    return 18;
  }
  return y;
};

const formatSectionLabel = (value) =>
  String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const buildInterviewPdfPayload = ({
  session,
  report,
  questions = [],
  atsReport,
  candidateName,
  candidateEmail,
  jobTitle,
  companyName,
  interviewType,
  difficulty,
}) => ({
  candidateName: candidateName || session?.candidate_name || "Candidate",
  candidateEmail: candidateEmail || session?.candidate_email || "",
  jobTitle: jobTitle || session?.job_title || "Interview",
  companyName: companyName || session?.company_name || "Interview Genius",
  interviewType: interviewType || session?.interview_type || "Mixed",
  difficulty: difficulty || session?.difficulty || "Mid",
  atsReport: atsReport || session?.ats_report || {},
  questions: questions.length ? questions : session?.questions || [],
  report: report || session?.responses?.[0]?.report || {},
});

export const downloadInterviewPdf = (filename, payload) => {
  const doc = new jsPDF();
  const interviewReport = payload.report || {};
  const atsReport = payload.atsReport || {};
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Interview Genius Hiring Report", 14, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Candidate: ${payload.candidateName || "Candidate"}`, 14, y);
  y += 6;
  doc.text(`Email: ${payload.candidateEmail || "N/A"}`, 14, y);
  y += 6;
  doc.text(`Role: ${payload.jobTitle || "Interview"}`, 14, y);
  y += 6;
  doc.text(`Company: ${payload.companyName || "Interview Genius"}`, 14, y);
  y += 6;
  doc.text(`Interview Type: ${payload.interviewType || "Mixed"} | Difficulty: ${payload.difficulty || "Mid"}`, 14, y);
  y += 10;

  y = ensurePageSpace(doc, y);
  y = addSectionTitle(doc, "ATS Overview", y);
  y = addParagraph(doc, `ATS Score: ${atsReport.overall_score ?? "N/A"}`, y, { bold: true });
  y = addParagraph(doc, atsReport.summary || "ATS summary not available.", y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Generated Interview Questions", y);
  y = addBulletList(
    doc,
    (payload.questions || []).map((item, index) => `${index + 1}. ${item.question}`),
    y
  );

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Interview Summary", y);
  y = addParagraph(doc, `Overall Score: ${interviewReport.overall_score ?? "N/A"}`, y, { bold: true });
  y = addParagraph(doc, `Recommendation: ${interviewReport.recommended_decision || "Pending"}`, y, { bold: true });
  y = addParagraph(doc, interviewReport.summary || "Interview summary not available.", y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "Transcript", y);
  y = addParagraph(doc, interviewReport.transcript?.summary || "Transcript summary not available.", y);
  y = addParagraph(doc, interviewReport.transcript?.full_text || "Transcript not available.", y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "Communication Analysis", y);
  y = addParagraph(doc, `Sentiment: ${interviewReport.verbal_analysis?.sentiment || "N/A"}`, y);
  y = addParagraph(doc, `Pace: ${interviewReport.verbal_analysis?.pace || "N/A"}`, y);
  y = addParagraph(doc, interviewReport.verbal_analysis?.observations || "No communication observations available.", y);
  y = addParagraph(doc, interviewReport.content_analysis?.content_observations || "No content observations available.", y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "ATS Improvement Suggestions", y);
  y = addBulletList(doc, atsReport.suggestions || [], y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "Interview Strengths", y);
  y = addBulletList(doc, interviewReport.strengths || [], y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "Interview Weaknesses", y);
  y = addBulletList(doc, interviewReport.weaknesses || [], y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "Recommendations", y);
  y = addBulletList(doc, interviewReport.recommendations || [], y);

  y = ensurePageSpace(doc, y, 40);
  y = addSectionTitle(doc, "ATS Section Scores", y);
  Object.entries(atsReport.section_scores || {}).forEach(([key, section]) => {
    y = ensurePageSpace(doc, y, 20);
    y = addParagraph(
      doc,
      `${formatSectionLabel(key)}: ${Math.round(section.score || 0)}/100`,
      y,
      { bold: true }
    );
    y = addParagraph(doc, section.description || "", y);
  });

  doc.save(filename);
};

export const downloadAtsPdf = (filename, payload) => {
  const doc = new jsPDF();
  const report = payload.report || {};
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Interview Genius ATS Report", 14, y);
  y += 10;

  y = addParagraph(doc, `Role: ${payload.jobDetails?.title || "Not provided"}`, y, { bold: true });
  y = addParagraph(doc, `Overall Score: ${report.overall_score ?? "N/A"}`, y, { bold: true });
  y = addParagraph(doc, report.summary || "ATS summary not available.", y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Matched Keywords", y);
  y = addBulletList(doc, report.keywords?.matched || [], y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Missing Keywords", y);
  y = addBulletList(doc, report.keywords?.missing || [], y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Suggestions", y);
  y = addBulletList(doc, report.suggestions || [], y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Strengths", y);
  y = addBulletList(doc, report.strengths || [], y);

  y = ensurePageSpace(doc, y, 30);
  y = addSectionTitle(doc, "Weaknesses", y);
  y = addBulletList(doc, report.weaknesses || [], y);

  doc.save(filename);
};

export const downloadComparisonPdf = (filename, comparison) => {
  const doc = new jsPDF();
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Candidate Comparison Ranking", 14, y);
  y += 10;

  (comparison?.candidates || []).forEach((candidate, index) => {
    y = ensurePageSpace(doc, y, 28);
    y = addParagraph(
      doc,
      `${index + 1}. ${candidate.candidate_name || "Candidate"} - ${candidate.job_title || "Role"}`,
      y,
      { bold: true }
    );
    y = addParagraph(
      doc,
      `Score: ${candidate.overall_score || 0} | Decision: ${candidate.recommended_decision || "Pending"} | Interview Type: ${candidate.interview_type || "Mixed"}`,
      y
    );
  });

  doc.save(filename);
};

export const printCurrentPage = () => {
  window.print();
};
