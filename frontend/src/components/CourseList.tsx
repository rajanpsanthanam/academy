interface Course {
    enrollment?: {
        status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
    };
}

const enrollmentStats = {
    total: courses.length,
    enrolled: courses.filter((course: Course) => course.enrollment?.status === "ENROLLED").length,
    dropped: courses.filter((course: Course) => course.enrollment?.status === "DROPPED").length,
    completed: courses.filter((course: Course) => course.enrollment?.status === "COMPLETED").length
}; 