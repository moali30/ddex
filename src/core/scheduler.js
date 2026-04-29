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
 * Supports period-locked courses via course.lockedPeriod.
 *
 * @param {Array}  unassigned   - List of course objects to schedule
 * @param {Array}  levels       - Array of study level definitions
 * @param {Array}  matrices     - Array of conflict matrices (one per regulation)
 * @param {number} totalDays    - Number of days available
 * @param {number[]} [holidays] - Day indices to skip (optional)
 * @param {Object} [periodsMap] - Map of levelIndex → periodName (for period locking)
 * @returns {{ grid: Object, unassigned: Array }}
 */
export function optimizeSchedule(unassigned, levels, matrices, totalDays, holidays = [], periodsMap = {}) {
    const holidaySet = new Set(holidays);

    const courses = [...unassigned].map(c => {
        let conflicts = 0;
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

    courses.sort((a, b) => b.difficulty - a.difficulty);

    const grid = {};
    for (let d = 0; d < totalDays; d++) {
        grid[d] = {};
        for (let l = 0; l < levels.length; l++) {
            grid[d][l] = [];
        }
    }

    const remaining = [];

    for (const course of courses) {
        let bestDay = -1;
        let minConflicts = Infinity;

        for (let d = 0; d < totalDays; d++) {
            if (holidaySet.has(d)) continue;
            const dayConflicts = calculateConflictsOnDay(course, d, grid, matrices);

            if (dayConflicts === 0) {
                bestDay = d;
                break;
            }
            if (dayConflicts < minConflicts) {
                minConflicts = dayConflicts;
                bestDay = d;
            }
        }

        if (bestDay !== -1) {
            // Determine target level — respect period lock
            let targetLevelIdx = course.scheduleId !== undefined
                ? course.scheduleId % levels.length
                : 0;

            if (course.lockedPeriod && periodsMap) {
                const matchingLevel = Object.entries(periodsMap).find(
                    ([, pName]) => pName === course.lockedPeriod
                );
                if (matchingLevel) {
                    targetLevelIdx = parseInt(matchingLevel[0]);
                }
            }

            grid[bestDay][targetLevelIdx].push(course);
        } else {
            remaining.push(course);
        }
    }

    return { grid, unassigned: remaining };
}

/**
 * Returns the number of student clashes if targetCourse is placed on day.
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

// ─── Swap Days ────────────────────────────────────────────────────────────────

/**
 * Swaps the entire contents of two days across all tabs.
 */
export function swapDays(schedulerTabs, dayA, dayB) {
    for (const tabKey in schedulerTabs) {
        const tab = schedulerTabs[tabKey];
        const gridA = tab.grid[dayA] || {};
        const gridB = tab.grid[dayB] || {};
        tab.grid[dayA] = gridB;
        tab.grid[dayB] = gridA;
    }
}

// ─── Optimize Student Gaps ────────────────────────────────────────────────────

/**
 * Optimizes the schedule so students get maximum gap between consecutive exams.
 * Uses greedy day-swap: repeatedly tries swapping day contents to reduce
 * the total "consecutive exam" penalty.
 *
 * @param {Object} schedulerTabs - appState.scheduler.tabs
 * @param {Array}  matrices      - Conflict matrices
 * @param {number} totalDays     - Total number of days
 * @param {number[]} holidays    - Holiday day indices
 * @returns {{ swapsMade: number, penaltyBefore: number, penaltyAfter: number }}
 */
export function optimizeStudentGaps(schedulerTabs, matrices, totalDays, holidays = []) {
    const holidaySet = new Set(holidays);

    // Build a merged view of all tabs' grids
    const buildMergedGrid = () => {
        const merged = {};
        for (let d = 0; d < totalDays; d++) merged[d] = [];
        for (const tabKey in schedulerTabs) {
            const g = schedulerTabs[tabKey].grid;
            for (const d in g) {
                for (const l in g[d]) {
                    (g[d][l] || []).forEach(c => merged[d].push(c));
                }
            }
        }
        return merged;
    };

    // Calculate consecutive-day penalty
    const calcPenalty = () => {
        const merged = buildMergedGrid();
        let penalty = 0;

        const activeDays = [];
        for (let d = 0; d < totalDays; d++) {
            if (!holidaySet.has(d)) activeDays.push(d);
        }

        for (let i = 0; i < activeDays.length - 1; i++) {
            const dayA = activeDays[i];
            const dayB = activeDays[i + 1];
            const coursesA = merged[dayA] || [];
            const coursesB = merged[dayB] || [];

            for (const cA of coursesA) {
                for (const cB of coursesB) {
                    if (cA.subCode === cB.subCode) continue;
                    penalty += getSharedStudentsCount(cA.subCode, cB.subCode, matrices);
                }
            }
        }
        return penalty;
    };

    // Check same-day conflicts on a specific day
    const hasSameDayConflict = (dayIdx) => {
        const merged = buildMergedGrid();
        const courses = merged[dayIdx] || [];
        for (let i = 0; i < courses.length; i++) {
            for (let j = i + 1; j < courses.length; j++) {
                if (getSharedStudentsCount(courses[i].subCode, courses[j].subCode, matrices) > 0) {
                    return true;
                }
            }
        }
        return false;
    };

    const penaltyBefore = calcPenalty();
    let swapsMade = 0;
    let improved = true;
    let iterations = 0;
    const maxIterations = totalDays * totalDays;

    while (improved && iterations < maxIterations) {
        improved = false;
        iterations++;

        const activeDays = [];
        for (let d = 0; d < totalDays; d++) {
            if (!holidaySet.has(d)) activeDays.push(d);
        }

        for (let i = 0; i < activeDays.length && !improved; i++) {
            for (let j = i + 1; j < activeDays.length && !improved; j++) {
                const dayA = activeDays[i];
                const dayB = activeDays[j];

                const currentPenalty = calcPenalty();

                // Try swapping
                swapDays(schedulerTabs, dayA, dayB);

                // Check if swap introduced same-day conflicts
                if (hasSameDayConflict(dayA) || hasSameDayConflict(dayB)) {
                    swapDays(schedulerTabs, dayA, dayB); // Revert
                    continue;
                }

                const newPenalty = calcPenalty();

                if (newPenalty < currentPenalty) {
                    swapsMade++;
                    improved = true;
                } else {
                    swapDays(schedulerTabs, dayA, dayB); // Revert
                }
            }
        }
    }

    const penaltyAfter = calcPenalty();
    return { swapsMade, penaltyBefore, penaltyAfter };
}

// ─── Redistribute Evenly ──────────────────────────────────────────────────────

/**
 * Redistributes courses across days for balanced load while maintaining zero conflicts.
 *
 * @param {Object} schedulerTabs - appState.scheduler.tabs
 * @param {Array}  matrices      - Conflict matrices
 * @param {number} totalDays     - Total number of days
 * @param {number[]} holidays    - Holiday day indices
 * @returns {{ moved: number, before: number[], after: number[] }}
 */
export function redistributeEvenly(schedulerTabs, matrices, totalDays, holidays = []) {
    const holidaySet = new Set(holidays);

    const activeDays = [];
    for (let d = 0; d < totalDays; d++) {
        if (!holidaySet.has(d)) activeDays.push(d);
    }
    if (activeDays.length === 0) return { moved: 0, before: [], after: [] };

    const countCoursesOnDay = (day) => {
        let count = 0;
        for (const tabKey in schedulerTabs) {
            const g = schedulerTabs[tabKey].grid[day] || {};
            for (const l in g) {
                count += (g[l] || []).length;
            }
        }
        return count;
    };

    const wouldConflict = (course, day) => {
        for (const tabKey in schedulerTabs) {
            const g = schedulerTabs[tabKey].grid[day] || {};
            for (const l in g) {
                for (const assigned of (g[l] || [])) {
                    if (getSharedStudentsCount(course.subCode, assigned.subCode, matrices) > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const before = activeDays.map(d => countCoursesOnDay(d));
    let moved = 0;
    let improved = true;
    let iterations = 0;
    const maxIterations = 200;

    while (improved && iterations < maxIterations) {
        improved = false;
        iterations++;

        const dayCounts = activeDays.map(d => ({ day: d, count: countCoursesOnDay(d) }));
        dayCounts.sort((a, b) => b.count - a.count);

        const maxDay = dayCounts[0];
        const minDay = dayCounts[dayCounts.length - 1];

        if (maxDay.count - minDay.count <= 1) break;

        let movedOne = false;
        for (const tabKey in schedulerTabs) {
            if (movedOne) break;
            const g = schedulerTabs[tabKey].grid[maxDay.day] || {};
            for (const l in g) {
                if (movedOne) break;
                const courses = g[l] || [];
                for (let ci = 0; ci < courses.length; ci++) {
                    const course = courses[ci];
                    if (course.lockedPeriod) continue; // Don't move period-locked courses

                    if (!wouldConflict(course, minDay.day)) {
                        courses.splice(ci, 1);
                        if (!schedulerTabs[tabKey].grid[minDay.day]) {
                            schedulerTabs[tabKey].grid[minDay.day] = {};
                        }
                        if (!schedulerTabs[tabKey].grid[minDay.day][l]) {
                            schedulerTabs[tabKey].grid[minDay.day][l] = [];
                        }
                        schedulerTabs[tabKey].grid[minDay.day][l].push(course);

                        moved++;
                        movedOne = true;
                        improved = true;
                        break;
                    }
                }
            }
        }

        if (!movedOne) break;
    }

    const after = activeDays.map(d => countCoursesOnDay(d));
    return { moved, before, after };
}
