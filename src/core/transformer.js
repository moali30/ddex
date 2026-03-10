/**
 * Transform student-centric data (student → courses) into
 * course-centric data (course → students).
 *
 * @param {Map<string, string[]>} students - Map of studentCode → [subjectCodes]
 * @returns {Map<string, Set<string>>} - Map of subjectCode → Set of studentCodes
 */
export function transformToCourseView(students) {
    const courses = new Map();

    for (const [studentCode, subjectCodes] of students) {
        for (const subCode of subjectCodes) {
            if (!courses.has(subCode)) {
                courses.set(subCode, new Set());
            }
            courses.get(subCode).add(studentCode);
        }
    }

    return courses;
}

/**
 * Convert a course view Map to a sorted array for display.
 *
 * @param {Map<string, Set<string>>} courseView
 * @returns {{ subCode: string, students: string[] }[]}
 */
export function courseViewToArray(courseView) {
    const arr = [];
    for (const [subCode, students] of courseView) {
        arr.push({
            subCode,
            students: [...students].sort(),
        });
    }
    arr.sort((a, b) => a.subCode.localeCompare(b.subCode));
    return arr;
}
