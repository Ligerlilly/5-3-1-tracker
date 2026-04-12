export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
}

export function getWeekLabel(weekNumber: number): string {
    const labels: Record<number, string> = {
        1: "Week 1 (3×5)",
        2: "Week 2 (3×3)",
        3: "Week 3 (5/3/1)",
        4: "Week 4 (Deload)",
    };
    return labels[weekNumber] || `Week ${weekNumber}`;
}
