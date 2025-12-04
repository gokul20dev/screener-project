let courses = [];

const CourseSelectionService = {
    loadCoursesFromApi() {
        const endpointUrl = `${ACCOUNT_END_POINT}/course`;
        makeApiCall({
            url: endpointUrl,
            method: "GET",
            disableLoading: true,
            successCallback: function (response) {
                courses = response?.data || [];
                CourseSelectionUI.renderCourseList(courses);
            },
            errorCallback: function (error) {
                console.error("Failed to fetch courses:", error);
                displayToast("Failed to load Course data", error);
            }
        });
    },
}

const CourseSelectionUI = {
    renderCourseList(courses) {
        const $courseList = $('#courseList');
        const $selectedCourses = $('#selectedCourses');
        const $searchInput = $('#searchInput');

        $courseList.empty();
        $selectedCourses.empty().text('None'); // Reset badges

        if (!courses.length) {
            $courseList.append('<div class="no-courses">No courses available</div>');
            return;
        }

        // ✅ Render courses
        courses.forEach(course => {
            $courseList.append(`
            <div class="course-item" data-text="${course.name.toLowerCase()}" data-courseid="${course._id}">
                <input type="checkbox" id="${course._id}" class="course-checkbox" value="${course.name}">
                <label for="${course._id}">${course.name}</label>
            </div>
        `);
        });

        // ✅ Attach click handler to each checkbox by ID
        $courseList.find('.course-checkbox').each(function () {
            const $checkbox = $(this);
            const courseId = $checkbox.attr('id');

            $checkbox.off('click').on('click', function () {
                const courseLabel = $(`label[for="${courseId}"]`).text();

                if (this.checked) {
                    if (!$(`#badge-${courseId}`).length) {
                        if ($selectedCourses.text().trim() === 'None') $selectedCourses.empty();

                        $selectedCourses.append(`
                <span class="badge d-inline-flex align-items-center me-1" id="badge-${courseId}">
                    ${courseLabel}
                    <span class="remove-btn ms-2 cursor-pointer" data-id="${courseId}">
                    <i class="fas fa-times small-icon"></i>
                    </span>
                </span>
                `);
                    }
                } else {
                    $(`#badge-${courseId}`).remove();
                    if (!$selectedCourses.find('.badge').length) {
                        $selectedCourses.text('None');
                    }
                }
            });
        });

        // ✅ Handle badge remove button
        $selectedCourses.off('click').on('click', '.remove-btn', function () {
            const courseId = $(this).data('id');
            $(`#${courseId}`).prop('checked', false);
            $(`#badge-${courseId}`).remove();
            if (!$selectedCourses.find('.badge').length) {
                $selectedCourses.text('None');
            }
        });

        // ✅ Search filter
        $searchInput.off('keyup').on('keyup', function () {
            const searchTerm = $(this).val().toLowerCase();
            const $items = $('.course-item');
            let hasMatches = false;

            $items.each(function () {
                const itemText = $(this).data('text') || '';
                const match = itemText.includes(searchTerm);
                $(this).toggle(match);
                if (match) hasMatches = true;
            });

            $('#noMatches').remove();
            if (!hasMatches) {
                $courseList.append('<div id="noMatches" class="no-courses">No matching courses</div>');
            }
        });
    }
};



const CourseController = {
    init() {
        CourseSelectionUI.renderCourseList(courses);
        CourseSelectionService.loadCoursesFromApi();
    },
}

$(document).ready(function () {
    CourseController.init();
});
// Exporting the CourseController for potential external use