        $(document).ready(function () {
            const urlParams = new URLSearchParams(window.location.search);
            const cid = urlParams.get('cid');

            // Email validation function
            function isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }

            $('#registerStudentForm').on('submit', function (e) {
                e.preventDefault();

                const email = $('#studentEmail').val().trim();
                const errorMessage = $('#errorMessage');


                if (!email) {
                    errorMessage.removeClass('d-none').text('Email is required');
                    return;
                }

                if (!isValidEmail(email)) {
                    errorMessage.removeClass('d-none').text('Please enter a valid email address');
                    return;
                }


                showLoader(true);

                makeApiCall({
                    url: `${ATTENDER_END_POINT}/details?email=${email}`,
                    method: 'GET',
                    isApiKey: true,
                    successCallback: (response) => {

                        showLoader(false);


                        toastr.success('Student details fetched successfully, please wait and register!', 'Success');


                        window.location.href = `/fullscreenexam/student-registration/?attenderId=${response?.data?._id}`;
                    },
                    errorCallback: (errorMessage) => {

                        showLoader(false);


                        toastr.error(errorMessage, 'Error');
                        $('#errorMessage').removeClass('d-none').text(errorMessage);
                    }
                });
            });
        });
  