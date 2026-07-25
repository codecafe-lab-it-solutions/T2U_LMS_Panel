// A course has no single required "primary instructor" — instructor↔course association is
// driven entirely by batch membership (Course -> BatchCourse -> Batch -> BatchInstructor). The
// legacy Course.instructor_id column is still kept (nullable) for old data and for an instructor
// self-creating their own course, but "which courses does this instructor see as theirs" must
// match EITHER path so a course only ever reachable via a batch assignment still shows up.
function courseOwnedByInstructorWhere(userId) {
  return {
    OR: [
      { instructor_id: userId },
      { batches: { some: { batch: { instructors: { some: { user_id: userId } } } } } },
    ],
  };
}

async function isCourseInstructor(prismaClient, courseId, userId) {
  const link = await prismaClient.batchInstructor.findFirst({
    where: { user_id: userId, batch: { courses: { some: { course_id: courseId } } } },
    select: { id: true },
  });
  return !!link;
}

module.exports = { courseOwnedByInstructorWhere, isCourseInstructor };
