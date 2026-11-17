// src/lib/arcai.js
// ARC AI detection rules — unchanged from the original ArcAIPage.

/* "Something Went Wrong": error_msg === "No Response" OR response_body === "No Response" */
export const isSWW = (s) =>
  (s.error_msg     || "").trim() === "No Response" ||
  (s.response_body || "").trim() === "No Response";

export const isArcAIRun = (r) => {
  const proj = (r.project || "").toLowerCase().trim();
  return proj.includes("arc ai") || r.script_type === "ai";
};

export const countSWW = (results) =>
  (results || []).filter(isArcAIRun)
    .reduce((acc, r) => acc + (r.steps || []).filter(isSWW).length, 0);
