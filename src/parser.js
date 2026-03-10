import * as XLSX from 'xlsx';

/**
 * Parse an uploaded Excel file and extract student-course registrations.
 * Handles merged cells by forward-filling student Code values.
 *
 * @param {ArrayBuffer} buffer - The file content as ArrayBuffer
 * @returns {{ sheetName: string, students: Map<string, string[]> }[]}
 *   Array of sheets, each with a map of studentCode → [subjectCodes]
 */
export function parseExcelFile(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array', cellStyles: false });
    const results = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const mergedRanges = sheet['!merges'] || [];

        // Decode sheet to array-of-arrays (with null for empty cells)
        const rawData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null,
            blankrows: false,
        });

        if (rawData.length < 2) {
            results.push({ sheetName, students: new Map(), courseNames: {} });
            continue;
        }

        // Build a map of merged cell ranges for the Code column (B = index 1)
        // This helps us know which rows belong to the same student
        const mergeMap = buildMergeMap(mergedRanges);

        // Parse rows (skip header row 0)
        const students = new Map(); // code → Set of sub_codes
        const courseNames = {};      // sub_code → subject_name
        let currentCode = null;

        for (let r = 1; r < rawData.length; r++) {
            const row = rawData[r];
            if (!row || row.length === 0) continue;

            const serialNum = row[0]; // Column A: #
            const code = row[1];      // Column B: Code
            const subCode = row[4];   // Column E: Sub_Code
            const subName = row[5];   // Column F: Subject name

            // If we have a code value, this is a new student
            if (code !== null && code !== undefined && String(code).trim() !== '') {
                currentCode = String(code).trim();
                if (!students.has(currentCode)) {
                    students.set(currentCode, new Set());
                }
            }

            // Add the subject to the current student
            if (currentCode && subCode !== null && subCode !== undefined && String(subCode).trim() !== '') {
                const cleanSubCode = normalizeSubCode(String(subCode).trim());
                students.get(currentCode).add(cleanSubCode);

                if (subName && !courseNames[cleanSubCode]) {
                    courseNames[cleanSubCode] = String(subName).trim();
                }
            }
        }

        // Convert Sets to Arrays
        const studentsMap = new Map();
        for (const [code, courses] of students) {
            studentsMap.set(code, [...courses]);
        }

        results.push({ sheetName, students: studentsMap, courseNames });
    }

    return results;
}

/**
 * Normalize subject code: remove extra spaces, non-breaking spaces, dots.
 * Also ensures a space between letter and digit sequences.
 * e.g., "ACCT. 406" → "ACCT 406", "ITBU.301" → "ITBU 301", "AGP1" → "AGP 1"
 */
function normalizeSubCode(code) {
    return code
        .replace(/\u00a0/g, ' ')       // non-breaking space → space
        .replace(/\.\s*/g, ' ')         // dot followed by optional space → space
        .replace(/([A-Za-z])(\d)/g, '$1 $2')  // insert space between letters and digits (AGP1 → AGP 1)
        .replace(/\s+/g, ' ')           // collapse multiple spaces
        .trim();
}

/**
 * Build a map of merged cell ranges for quick lookup
 */
function buildMergeMap(mergedRanges) {
    const map = {};
    for (const range of mergedRanges) {
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                map[`${r},${c}`] = { startRow: range.s.r, startCol: range.s.c };
            }
        }
    }
    return map;
}
