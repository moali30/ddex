/**
 * Merge course data from multiple sheets within the same regulation.
 * If the same course appears in multiple sheets, student lists are unioned.
 *
 * @param {Array<{ sheetName: string, students: Map<string, string[]>, courseNames: object }>} sheets
 *   Array of parsed sheet data
 * @param {Array<{ name: string, sheetIndices: number[] }>} regulations
 *   Array of regulation definitions, each listing which sheet indices belong to it
 * @returns {Array<{ name: string, courses: Map<string, Set<string>>, courseNames: object }>}
 */
export function buildRegulations(sheets, regulations) {
    const result = [];

    for (const reg of regulations) {
        const mergedCourses = new Map();  // subCode → Set of studentCodes
        const mergedNames = {};           // subCode → subject name
        const sheetBreakdown = {};        // subCode → { sheetName: count }

        for (const idx of reg.sheetIndices) {
            if (idx < 0 || idx >= sheets.length) continue;
            const sheet = sheets[idx];

            // Merge courseNames
            for (const [code, name] of Object.entries(sheet.courseNames)) {
                if (!mergedNames[code]) {
                    mergedNames[code] = name;
                }
            }

            // Merge student registrations
            for (const [studentCode, subjectCodes] of sheet.students) {
                for (const subCode of subjectCodes) {
                    if (!mergedCourses.has(subCode)) {
                        mergedCourses.set(subCode, new Set());
                    }
                    const courseStudents = mergedCourses.get(subCode);
                    if (!courseStudents.has(studentCode)) {
                        courseStudents.add(studentCode);

                        if (!sheetBreakdown[subCode]) {
                            sheetBreakdown[subCode] = {};
                        }
                        const bdown = sheetBreakdown[subCode];
                        bdown[sheet.sheetName] = (bdown[sheet.sheetName] || 0) + 1;
                    }
                }
            }
        }

        result.push({
            name: reg.name,
            courses: mergedCourses,
            courseNames: mergedNames,
            sheetBreakdown: sheetBreakdown,
            sheetIndices: reg.sheetIndices,
        });
    }

    return result;
}
