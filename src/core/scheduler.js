/**
 * Core Scheduler Logic
 * Contains algorithms to auto-optimize exams to minimize/eliminate conflicts
 */

/**
 * Helper: get shared students across all matrices
 */
function getSharedStudentsCount(code1, code2, matrices) {
    if (!matrices) return 0;
    let maxShared = 0;
    for (const m of matrices) {
        const idx1 = m.courseList.indexOf(code1);
        const idx2 = m.courseList.indexOf(code2);
        if (idx1 >= 0 && idx2 >= 0) {
            const shared = m.matrix[Math.min(idx1, idx2)][Math.max(idx1, idx2)];
            if (shared && shared.length > 0) {
                maxShared = Math.max(maxShared, shared.length);
            }
        }
    }
    return maxShared;
}

/**
 * Attempts to automatically assign courses to days.
 *
 * @param {Array}  unassigned   - List of course objects to schedule
 * @param {Array}  levels       - Array of study level definitions
 * @param {Array}  matrices     - Array of conflict matrices (one per regulation)
 * @param {number} totalDays    - Number of days available
 * @param {number[]} [holidays] - Day indices to skip (optional)
 * @returns {{ grid: Object, unassigned: Array }}
 */
export function optimizeSchedule(unassigned, levels, matrices, totalDays, holidays = []) {
    // 1. Compute difficulty score for every course — harder courses get scheduled first
    const holidaySet = new Set(holidays);

    const courses = [...unassigned].map(c => {
        let conflicts = 0;

        // Sum all potential conflicts across all courses in all matrices
        for (const m of matrices) {
            const mIdx = m.courseList.indexOf(c.subCode);
            if (mIdx >= 0) {
                const n = m.courseList.length;
                for (let j = 0; j < n; j++) {
                    if (j === mIdx) continue;
                    const cell = m.matrix[Math.min(mIdx, j)][Math.max(mIdx, j)];
                    if (cell && cell.length > 0) conflicts += cell.length;
                }
            }
        }

        return {
            ...c,
            conflictScore: conflicts,
            difficulty: conflicts + ((c.students || 0) * 0.1)
        };
    });

    // Sort descending by difficulty — schedule hardest courses first
    courses.sort((a, b) => b.difficulty - a.difficulty);

    // 2. Initialize empty grid (rows = days, cols = levels)
    const grid = {};
    for (let d = 0; d < totalDays; d++) {
        grid[d] = {};
        for (let l = 0; l < levels.length; l++) {
            grid[d][l] = [];
        }
    }

    const remaining = [];

    // 3. Greedy assignment — pick the day with fewest clashes for each course
    for (const course of courses) {
        let bestDay = -1;
        let minConflicts = Infinity;

        for (let d = 0; d < totalDays; d++) {
            if (holidaySet.has(d)) continue; // Skip holidays

            const dayConflicts = calculateConflictsOnDay(course, d, grid, matrices);

            if (dayConflicts === 0) {
                bestDay = d;
                break; // Perfect spot — no need to look further
            }

            if (dayConflicts < minConflicts) {
                minConflicts = dayConflicts;
                bestDay = d;
            }
        }

        if (bestDay !== -1) {
            // Find a level column. Since levels are global now, we can just distribute
            // them somewhat evenly, or find the first empty slot.
            // Let's just pick a column. A simple approach is level index = course's scheduleId % levels.length
            // to spread them out if there are no exact matches.
            const targetLevelIdx = course.scheduleId !== undefined
                ? course.scheduleId % levels.length
                : 0;

            grid[bestDay][targetLevelIdx].push(course);
        } else {
            remaining.push(course);
        }
    }

    return { grid, unassigned: remaining };
}

/**
 * Returns the number of student clashes if `targetCourse` is placed on `day`.
 */
function calculateConflictsOnDay(targetCourse, day, grid, matrices) {
    let clashStudents = 0;

    for (const lvlStr in grid[day]) {
        for (const assigned of grid[day][parseInt(lvlStr)]) {
            clashStudents += getSharedStudentsCount(targetCourse.subCode, assigned.subCode, matrices);
        }
    }

    return clashStudents;
}
