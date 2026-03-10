/**
 * Generate a conflict matrix for courses within a regulation.
 * The matrix shows whether any student is registered in both courses (Yes/No).
 *
 * @param {Map<string, Set<string>>} courses - Map of subCode → Set of studentCodes
 * @returns {{ courseList: string[], matrix: boolean[][] }}
 *   courseList is the sorted list of course codes.
 *   matrix[i][j] is true if courses[i] and courses[j] share at least one student.
 */
export function generateConflictMatrix(courses) {
    const courseList = [...courses.keys()].sort();
    const n = courseList.length;

    // Pre-convert to arrays for faster iteration is not needed;
    // Set.has() is O(1), so we iterate the smaller set
    const courseSets = courseList.map(c => courses.get(c));

    const matrix = [];

    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                row.push(null); // same course, mark as self
            } else if (j < i) {
                // Already computed in the upper triangle
                row.push(matrix[j][i]);
            } else {
                // Check intersection: iterate smaller set, check against larger
                const setA = courseSets[i];
                const setB = courseSets[j];
                let hasConflict = false;

                const [smaller, larger] = setA.size <= setB.size
                    ? [setA, setB]
                    : [setB, setA];

                for (const student of smaller) {
                    if (larger.has(student)) {
                        hasConflict = true;
                        break;
                    }
                }

                row.push(hasConflict);
            }
        }
        matrix.push(row);
    }

    return { courseList, matrix };
}

/**
 * Count the number of conflicts (Yes values) in the matrix for a given course.
 */
export function countConflicts(matrix, courseIndex) {
    let count = 0;
    for (let j = 0; j < matrix[courseIndex].length; j++) {
        if (matrix[courseIndex][j] === true) count++;
    }
    return count;
}
