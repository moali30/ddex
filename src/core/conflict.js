/**
 * Generate individual conflict matrices for each regulation.
 * Each matrix shows the common students registered in courses within that specific regulation.
 *
 * @param {Array<{ name: string, courses: Map<string, Set<string>>, courseNames: object }>} regulations
 * @returns {Array<{ regIndex: number, regName: string, courseList: string[], matrix: string[][][], courseNames: object }>}
 */
export function generateRegulationConflictMatrices(regulations) {
    const matrices = [];

    regulations.forEach((reg, regIndex) => {
        const courseList = [...reg.courses.keys()].sort();
        const n = courseList.length;
        const courseSets = courseList.map(c => reg.courses.get(c));
        const matrix = [];

        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    row.push(null); // self
                } else if (j < i) {
                    // Symmetric
                    row.push(matrix[j][i]);
                } else {
                    // Compute intersection
                    const setA = courseSets[i];
                    const setB = courseSets[j];
                    const sharedStudents = [];

                    const [smaller, larger] = setA.size <= setB.size
                        ? [setA, setB]
                        : [setB, setA];

                    for (const student of smaller) {
                        if (larger.has(student)) {
                            sharedStudents.push(student);
                        }
                    }

                    row.push(sharedStudents);
                }
            }
            matrix.push(row);
        }

        matrices.push({
            regIndex,
            regName: reg.name,
            courseList,
            matrix,
            courseNames: reg.courseNames
        });
    });

    return matrices;
}

/**
 * Count the number of conflicting courses (where shared students > 0) for a given course.
 */
export function countConflicts(matrix, courseIndex) {
    let count = 0;
    for (let j = 0; j < matrix[courseIndex].length; j++) {
        if (matrix[courseIndex][j] && matrix[courseIndex][j].length > 0) count++;
    }
    return count;
}
