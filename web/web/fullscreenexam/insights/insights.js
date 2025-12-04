$(document).ready(function() {
    // Sample data for demonstration
    // Load exams data from exams-list.json instead of using mock data
    let exams = [];
    let insight = [];
    let selectedTags = [];
    let allTags = [];

    getViewList();
    getExamsList();
    getAllTags();
    

    // Search insight functionality
    $('#searchInsights').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm.length === 0) {
            loadInsight(insight);
            return;
        }

        const filteredInsight = insight.filter(insight => 
            insight.name.toLowerCase().includes(searchTerm) || 
            insight.description.toLowerCase().includes(searchTerm)
        );
        
        loadInsight(filteredInsight);
    });

    // Filter checkboxes
    $('.filter-content input[type="checkbox"]').on('change', function() {
        const selectedFilters = [];
        $('.filter-content input[type="checkbox"]:checked').each(function() {
            selectedFilters.push($(this).val());
        });

        if (selectedFilters.length === 0) {
            loadInsight(insight);
            return;
        }

        const filteredInsight = insight.filter(insight => 
            selectedFilters.includes(insight.generatedStatus)
        );
        
        loadInsight(filteredInsight);
    });

    // Load insight into the page
    function loadInsight(insight) {
        const container = $('#insightsContainer');
        container.empty();
        
        if (insight?.length === 0) {
            container.html('<div class="no-results"><i class="fas fa-search"></i> No insight found</div>');
            return;
        }
        
        insight.forEach(insight => {
            // Get all exams
            const examNames = insight.exams.map(exam => exam.examName).join(', ');
            
            // Get all tags
            const allTags = [];
            insight.exams.forEach(exam => {
                if (exam.tags && exam.tags.length > 0) {
                    exam.tags.forEach(tag => {
                        if (!allTags.some(t => t.tagId === tag.tagId)) {
                            allTags.push(tag);
                        }
                    });
                }
            });
            
            // Create exam tags HTML
            const examTagsHTML = insight.exams.map(exam => `<span class="exam-tag"> ${exam.examName} </span>`).join('');
            
            // Create card HTML with enhanced icons
            const cardHTML = `
                <div class="insight-card" data-id="${insight._id}">
                    <div class="view-card-header">
                        <div class="card-title-container">
                            <h3 class="card-title"> ${insight.name}</h3>
                            <span class="status-badge status-${insight.generatedStatus}">${insight.generatedStatus.charAt(0).toUpperCase() + insight.generatedStatus.slice(1)}</span>
                        </div>
                        <p class="card-description">${insight.description}</p>
                        <div class="card-meta">
                            <span><i class="far fa-calendar-alt"></i> last updated <span class="last-updated">${new Date(insight.updatedAt).toLocaleDateString()}</span></span>
                        </div>
                    </div>
                    <div class="card-content">
                    <strong><i class="fas fa-book"></i> Exams:</strong> 
                        <div class="card-exams">
                            ${examTagsHTML}
                        </div>
                    </div>
                    <div class="view-card-footer">
                      
                        <div class="card-actions">
                            <button class="card-action-btn edit-insight" title="Edit Insight"><i class="fas fa-edit"></i></button>
                            <button class="card-action-btn delete-insight" title="Delete Insight"><i class="fas fa-trash"></i></button>
                            ${insight.generatedStatus === "pending" 
                                ? `<a href="javascript:void(0)" class="card-action-btn view-details generate-insight" title="Generate Insight"> Generate <i class="fas fa-cog"></i></a>` 
                                : `<button class="card-action-btn refresh-insight" title="Re-generate"><i class="fas fa-sync-alt"></i></button>
                                <a href="/fullscreenexam/insights/insight.html?id=${insight._id}" class="card-action-btn view-details" title="View Insight"> Insights <i class="fas fa-eye"></i></a>
                                   `
                            }
                        </div>
                    </div>
                </div>
            `;
            
            container.append(cardHTML);
        });
        
        // Add click event handler for delete buttons
        $('.delete-insight').on('click', function() {
            const insightCard = $(this).closest('.insight-card');
            const insightId = insightCard.data('id');
            const insightName = insightCard.find('.card-title').text().trim();
            
            // Show confirmation dialog
            if (confirm(`Are you sure you want to delete the insight "${insightName}"?`)) {
                deleteInsight(insightId, insightCard);
            }
        });

        // Add click event handler for edit buttons
        $('.edit-insight').on('click', function() {
            const insightCard = $(this).closest('.insight-card');
            const insightId = insightCard.data('id');
            editInsight(insightId);
        });
        
        // Add click event handler for generate buttons
        $('.generate-insight').on('click', function() {
            const insightCard = $(this).closest('.insight-card');
            const insightId = insightCard.data('id');
            const insightName = insightCard.find('.card-title').text().trim();
            
            // Show loading toast notification
            showNotification('Please wait, generating insight may take a few minutes', 'success');
            
            // Make API call to trigger insight generation
            const url = INSIGHT_END_POINT + '/generate?insightId=' + insightId;
            
            makeApiCall({
                method: 'get',
                url: url,
                successCallback: function(response) {
                    showNotification('Insight generation started successfully. It may take a few minutes to complete.', 'success');
                    
                    setTimeout(() => {
                        getViewList();
                    }, 2000);
                },
                errorCallback: function(error) {
                    console.error("Failed to trigger insight generation:", error);
                    showNotification('Failed to start insight generation. Please try again.', 'error');
                }
            });
        });
        
        // Add click event handler for refresh buttons
        $('.refresh-insight').on('click', function() {
            const insightCard = $(this).closest('.insight-card');
            const insightId = insightCard.data('id');
            const insightName = insightCard.find('.card-title').text().trim();
            
            // Show loading toast notification
            showNotification('Please wait, re-generating insight may take a few minutes', 'success');
            
            // Make API call to trigger insight generation
            const url = INSIGHT_END_POINT + '/generate?insightId=' + insightId;
            
            makeApiCall({
                method: 'get',
                url: url,
                successCallback: function(response) {
                    showNotification('Insight re-generation started successfully. It may take a few minutes to complete.', 'success');
                    
                    setTimeout(() => {
                        getViewList();
                    }, 2000);
                },
                errorCallback: function(error) {
                    console.error("Failed to re-generate insight:", error);
                    showNotification('Failed to start insight re-generation. Please try again.', 'error');
                }
            });
        });
    }

    // Function to delete an insight
    function deleteInsight(insightId, cardElement) {
        const url = INSIGHT_END_POINT + '?insightId=' + insightId;
        
        makeApiCall({
            method: 'delete',
            url: url,
            successCallback: function(response) {
                // Remove the card from the UI
                cardElement.fadeOut(300, function() {
                    $(this).remove();
                    
                    // If no insight left, show "No insight found" message
                    if ($('#insightsContainer').children().length === 0) {
                        $('#insightsContainer').html('<div class="no-results"><i class="fas fa-search"></i> No insight found</div>');
                    }
                });
                
                showNotification('Insight deleted successfully', 'success');
            },
            errorCallback: function(error) {
                console.error("Failed to delete insight:", error);
                showNotification('Failed to delete insight', 'error');
            }
        });
    }

    // CREATE INSIGHT MODAL FUNCTIONALITY
    
    // Variables for the Create View
    let selectedExams = [];
    let examTagsData = [];
    const steps = ['basicInfoStep', 'examSelectionStep'];
    const contents = ['basicInfoContent', 'examSelectionContent'];
    let currentStep = 0;
    let isEditMode = false;
    let currentEditId = null;
    
    // Show/hide drawer functions
    $('#create-btn').on('click', function() {
        isEditMode = false;
        currentEditId = null;
        openCreateView('Create New Insight');
    });
    
    $('#closeDrawer, #cancelCreate, #backToList').on('click', function() {
        closeCreateView();
    });
    
    // Function to edit an insight
    function editInsight(insightId) {
        isEditMode = true;
        currentEditId = insightId;
        
        // Fetch the insight data
        const url = INSIGHT_END_POINT + '?insightId=' + insightId;
        
        makeApiCall({
            method: 'get',
            url: url,
            successCallback: function(response) {
                if (response && response.data) {
                    const insight = response.data;
                    openCreateView('Edit Insight');
                    
                    // Populate form with insight data
                    $('#insightName').val(insight.name);
                    $('#insightDescription').val(insight.description);
                    
                    // Store selected exams from the insight
                    selectedExams = insight.exams.map(exam => ({
                        _id: exam.examId,
                        name: exam.examName
                    }));
                    
                    // Populate selected exams UI
                    $('#selectedExams').empty();
                    selectedExams.forEach(exam => {
                        const examElement = $(`
                            <div class="selected-exam" data-id="${exam._id}">
                                <span>${exam.name}</span>
                                <button class="remove-exam" title="Remove Exam">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `);
                        
                        examElement.find('.remove-exam').on('click', function() {
                            removeExam(exam._id);
                        });
                        
                        $('#selectedExams').append(examElement);
                    });
                    
                    // Clear selected tags before populating
                    selectedTags = [];
                    $('#selectedTags').empty();
                    
                    // Store exam tag data and mark all existing tags as selected
                    examTagsData = insight.exams.map(exam => ({
                        examId: exam.examId,
                        tags: exam.tags.map(tag => {
                            // Add the tag to selectedTags array for display
                            addTagToSelectedTags(tag.tagId, tag.tagName, exam.examId, exam.examName);
                            
                            return {
                                ...tag,
                                isSelected: true  // Mark all existing tags as selected
                            };
                        }) || []
                    }));

                    // Show notification about consolidated tags view
                    showNotification('Tags are consolidated - same tags from multiple exams are shown once', 'success');
                }
            },
            errorCallback: function(error) {
                console.error("Failed to load insight data:", error);
                showNotification('Failed to load insight for editing', 'error');
            }
        });
    }

    function openCreateView(title) {
        // Reset form before opening
        resetCreateForm();
        
        // Update the form title
        $('#createInsightTitle').html(`<i class="fas fa-lightbulb"></i> ${title || 'Create New Insight'}`);
        
        // Update submit button text based on mode
        $('#createInsightForm button[type="submit"]').text(isEditMode ? 'Update Insight' : 'Create Insight');
        
        // Hide list view and show create view
        $('#viewListPage').hide();
        $('.action-button-container').hide();
        $('#createInsightPage').show();
        
        // Initialize available exams
        populateAvailableExams(exams);
        
        // Prevent body scrolling (optional for full screen view)
        // $('body').css('overflow', 'hidden');
    }
    
    function closeCreateView() {
        $('#createInsightPage').hide();
        $('#viewListPage').show();
        $('.action-button-container').show();
        // $('body').css('overflow', 'auto');
        isEditMode = false;
        currentEditId = null;
    }
    
    function resetCreateForm() {
        // Don't clear form in edit mode
        if (!isEditMode) {
            // Clear form inputs
            $('#insightName').val('');
            $('#insightDescription').val('');
            $('#searchExams').val('');
            
            // Reset selected exams
            selectedExams = [];
            examTagsData = [];
            selectedTags = []; // Reset selected tags
            $('#selectedExams').empty();
            $('#selectedTags').empty(); // Clear selected tags container
        }
        
        // Reset to first step
        goToStep(0);
    }
    
    // Step navigation buttons
    $('#nextToExams').on('click', function() {
        const name = $('#insightName').val();
        const description = $('#insightDescription').val();
        
        if (!name || !description) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        goToStep(1);
        
        // If there are already exams selected, fetch their tags immediately
        if (selectedExams.length > 0) {
            const selectedExamIds = selectedExams.map(exam => exam._id);
            fetchExamTagsData(selectedExamIds);
        }
    });
    
    $('#backToBasicInfo').on('click', function() {
        goToStep(0);
    });
    
    // Search exams functionality
    $('#searchExams').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm.length === 0) {
            populateAvailableExams(exams);
            return;
        }
        
        const filteredExams = exams.filter(exam => 
            exam.name.toLowerCase().includes(searchTerm)
        );
        
        populateAvailableExams(filteredExams);
    });
    
    // Form submission
    $('#createInsightForm').on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#insightName').val();
        const description = $('#insightDescription').val();
        
        // Validate that exams are selected
        if (selectedExams.length === 0) {
            showNotification('Please select at least one exam', 'error');
            return;
        }
        
        // Validate that tags are selected
        if (selectedTags.length === 0) {
            showNotification('Please select at least one tag for each exam', 'error');
            return;
        }
        
        // Check if all exams have at least one tag
        // let missingTagsForExam = false;
        // let examWithoutTags = '';
        
        // selectedExams.forEach(exam => {
        //     const examTags = selectedTags.filter(tag => tag.examId === exam._id);
        //     if (examTags.length === 0) {
        //         missingTagsForExam = true;
        //         examWithoutTags = exam.name;
        //     }
        // });
        
        // if (missingTagsForExam) {
        //     showNotification(`Please select at least one tag for ${examWithoutTags}`, 'error');
        //     return false;
        // }
        
        // Gather selected exams with their tags
        const examsWithTags = [];
        
        // For each selected exam, find its tags in the selectedTags array
        selectedExams.forEach(exam => {
            const examTags = selectedTags.filter(tag => tag.examId === exam._id);
            
            examsWithTags.push({
                examId: exam._id,
                examName: exam.name,
                tags: examTags.map(tag => ({
                    tagId: tag.tagId,
                    tagName: tag.tagName
                }))
            });
        });
        
        const insightData = {
            name: name,
            description: description,
            generatedStatus: "pending",
            exams: examsWithTags,
        };

        let apiMethod = 'post';
        let apiUrl = INSIGHT_END_POINT;
        let successMessage = 'Insight created successfully';
        
        // If we're in edit mode, use PUT instead of POST and include the ID
        if (isEditMode && currentEditId) {
            apiMethod = 'put';
            apiUrl = INSIGHT_END_POINT + '?insightId=' + currentEditId;
            successMessage = 'Insight updated successfully';
        }

        makeApiCall({
            method: apiMethod,
            url: apiUrl,
            data: JSON.stringify(insightData),
            successCallback: function(data){
                showNotification(successMessage, 'success');
                closeCreateView();
                getViewList();
            },
            errorCallback: function(error){
                showNotification(`Failed to ${isEditMode ? 'update' : 'create'} insight`, 'error');
            }
        });
    });
    
    // Navigate to a specific step
    function goToStep(stepIndex) {
        // Hide all content steps
        $('.form-step').removeClass('active').css('display', 'none');
        
        // Show the selected step
        $(`#${contents[stepIndex]}`).addClass('active').css('display', 'flex');
        
        // Update progress bar width based on the step (33%, 66%, 100%)
        const progressWidth = ((stepIndex + 1) / steps.length) * 100;
        $('.stepper-progress-fill').css('width', `${progressWidth}%`);
        
        // Update step classes for both drawer and fullscreen view
        $('.stepper-step').removeClass('active completed');
        
        // Mark the current step as active in fullscreen view
        if ($('#createInsightPage').is(':visible')) {
            $(`#full${steps[stepIndex]}`).addClass('active');
            
            // Mark completed steps in fullscreen view
            for (let i = 0; i < stepIndex; i++) {
                $(`#full${steps[i]}`).addClass('completed');
            }
        } else {
            // For backward compatibility with drawer
            $(`#${steps[stepIndex]}`).addClass('active');
            
            // Mark completed steps in drawer
            for (let i = 0; i < stepIndex; i++) {
                $(`#${steps[i]}`).addClass('completed');
            }
        }
        
        // Store the current step
        currentStep = stepIndex;
    }
    
    // Populate available exams list
    function populateAvailableExams(exams) {
        const container = $('#availableExams');
        container.empty();
        
        if (exams.length === 0) {
            container.html('<div class="no-results"><i class="fas fa-search"></i> No exams found</div>');
            return;
        }
        
        exams.forEach(exam => {
            // Skip already selected exams
            if (selectedExams.some(selected => selected._id === exam._id)) {
                return;
            }
            
            const examItem = $(`
                <div class="exam-item" data-id="${exam._id}">
                    <i class="fas fa-book"></i>
                    <span>${exam.name}</span>
                    <button type="button" class="add-exam" title="Add Exam">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `);
            
            examItem.find('.add-exam').on('click', function() {
                addExam(exam);
            });
            
            container.append(examItem);
        });
    }
    
    // Add an exam to selected list
    function addExam(exam) {
        selectedExams.push(exam);
        
        const examElement = $(`
            <div class="selected-exam" data-id="${exam._id}">
                <span>${exam.name}</span>
                <button class="remove-exam" title="Remove Exam">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        
        examElement.find('.remove-exam').on('click', function() {
            removeExam(exam._id);
        });
        
        $('#selectedExams').append(examElement);
        
        // Refresh available exams
        populateAvailableExams(exams);
        
        // Fetch tags for the selected exams whenever a new exam is added
        const selectedExamIds = selectedExams.map(e => e._id);
        fetchExamTagsData(selectedExamIds);
        
        // Let user know we're automatically selecting tags
        showNotification(`Exam "${exam.name}" added with all tags automatically selected`, 'success');
    }
    
    // Remove an exam from selected list
    function removeExam(examId) {
        // Find the exam name before removing it
        const examName = selectedExams.find(exam => exam._id === examId)?.name || 'Exam';
        
        // Remove the exam
        selectedExams = selectedExams.filter(exam => exam._id !== examId);
        $(`.selected-exam[data-id="${examId}"]`).remove();
        
        // Also remove tags associated with this exam from selectedTags
        const removedTagsCount = selectedTags.filter(tag => tag.examId === examId).length;
        removeExamTagsFromSelectedTags(examId);
        
        // Show notification if tags were removed
        if (removedTagsCount > 0) {
            showNotification(`Removed ${examName} with ${removedTagsCount} tag${removedTagsCount > 1 ? 's' : ''}`, 'success');
        }
        
        // Refresh available exams
        populateAvailableExams(exams);
        
        // Clear any headers associated with this exam from the selected tags section
        $(`.exam-tags-header[data-exam-id="${examId}"]`).remove();
        
        // If there are still exams, refresh the tags
        if (selectedExams.length > 0) {
            const selectedExamIds = selectedExams.map(e => e._id);
            fetchExamTagsData(selectedExamIds);
        } else {
            // Clear selected tags
            selectedTags = [];
            $('#selectedTags').empty();
        }
    }
    
    // Remove tags associated with an exam from the selectedTags array and UI
    function removeExamTagsFromSelectedTags(examId) {
        // Filter out tags belonging to the removed exam
        selectedTags = selectedTags.filter(tag => tag.examId !== examId);
        
        // Update the selected tags UI
        updateSelectedTagsUI();
    }
    
    // Populate tag selection UI for selected exams - Now only handling data, not UI
    function populateTagSelection(examTagsData) {
        // Process the data but don't show individual tag checkboxes anymore
        examTagsData.forEach(examData => {
            // Find the exam details from the selected exams
            const exam = selectedExams.find(e => e._id === examData.examId);
            
            if (!exam) return;
            
            // Automatically add already selected tags to the selectedTags array
            examData.tags.forEach(tag => {
                if (tag.isSelected) {
                    addTagToSelectedTags(tag.tagId, tag.tagName, examData.examId, exam.name);
                }
            });
        });
    }
    
    // Add a tag to the selectedTags array and update the UI
    function addTagToSelectedTags(tagId, tagName, examId, examName) {
        // Check if the tag is already in the array
        if (!selectedTags.some(tag => tag.tagId === tagId && tag.examId === examId)) {
            selectedTags.push({
                tagId: tagId,
                tagName: tagName,
                examId: examId,
                examName: examName
            });
            
            // Update the selected tags UI
            updateSelectedTagsUI();
        }
    }
    
    // Update the selected tags UI based on the selectedTags array
    function updateSelectedTagsUI() {
        const container = $('#selectedTags');
        container.empty();
        
        if (selectedTags.length === 0) {
            // No need for additional empty message - the CSS :empty pseudo-class handles this
            return;
        }
        
        // Consolidate tags - group by tag name instead of by exam
        const uniqueTags = {};
        
        // First pass - gather all unique tags
        selectedTags.forEach(tag => {
            const tagKey = tag.tagName;
            
            if (!uniqueTags[tagKey]) {
                uniqueTags[tagKey] = {
                    tagName: tag.tagName,
                    exams: [],
                    tagIds: [] // Store all tag IDs for each exam this tag appears in
                };
            }
            
            // Add this exam to the tag's exams list if not already present
            if (!uniqueTags[tagKey].exams.some(e => e.examId === tag.examId)) {
                uniqueTags[tagKey].exams.push({
                    examId: tag.examId, 
                    examName: tag.examName,
                    tagId: tag.tagId
                });
                uniqueTags[tagKey].tagIds.push({ examId: tag.examId, tagId: tag.tagId });
            }
        });
        
        // Create tag elements for each unique tag
        Object.values(uniqueTags).forEach(uniqueTag => {
            const tagElement = $(`
                <div class="selected-tag unique-tag" data-tag-name="${uniqueTag.tagName}">
                    <i class="fas fa-tag"></i>
                    <span class="tag-name">${uniqueTag.tagName}</span>
                    <span class="tag-count" title="${uniqueTag.exams.map(e => e.examName).join(', ')}">
                        (${uniqueTag.exams.length})
                    </span>
                    <button class="remove-tag" title="Remove Tag">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `);
            
            // Add click handler for removing tag
            tagElement.find('.remove-tag').on('click', function(e) {
                e.stopPropagation(); // Prevent the tag click event from firing
                
                // Show confirmation dialog for removing from all exams
                if (confirm(`Remove "${uniqueTag.tagName}" tag from all exams?`)) {
                    // Remove this tag from all exams it belongs to
                    uniqueTag.tagIds.forEach(tagInfo => {
                        removeTagFromSelectedTags(tagInfo.tagId, tagInfo.examId);
                    });
                }
            });
            
            // Add click handler for showing which exams this tag belongs to
            tagElement.on('click', function() {
                const examsList = uniqueTag.exams.map(e => e.examName).join(', ');
                showNotification(`Tag "${uniqueTag.tagName}" is used in: ${examsList}`, 'success');
            });
            
            // Add info tooltip on hover
            tagElement.on('mouseenter', function() {
                const examsList = uniqueTag.exams.map(e => e.examName).join(', ');
                $(this).attr('title', `Used in: ${examsList}`);
            });
            
            container.append(tagElement);
        });
    }
    
    // Remove a tag from the selectedTags array and update the UI
    function removeTagFromSelectedTags(tagId, examId) {
        selectedTags = selectedTags.filter(tag => !(tag.tagId === tagId && tag.examId === examId));
        
        // Check if this was the last instance of this tag across all exams
        const tagName = selectedTags.find(tag => tag.tagId === tagId)?.tagName;
        
        // Check if this was the last tag for the exam
        const examName = selectedTags.find(tag => tag.examId === examId)?.examName;
        const remainingTagsForExam = selectedTags.filter(t => t.examId === examId);
        
        if (remainingTagsForExam.length === 0 && examName) {
            showNotification(`Warning: ${examName} has no tags selected. Please add at least one tag.`, 'error');
        }
        
        // Update the selected tags UI
        updateSelectedTagsUI();
    }

    // Add utility functions for notifications
    function showNotification(message, type) {
        // Remove any existing notification
        $('.notification').remove();
        
        // Create new notification
        const notification = $(`
            <div class="notification notification-${type}">
                ${message}
                <span class="close-notification">&times;</span>
            </div>
        `);
        
        // Add to document
        $('body').append(notification);
        
        // Show notification
        setTimeout(() => {
            notification.addClass('show');
        }, 10);
        
        // Add click event to close button
        notification.find('.close-notification').on('click', function() {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    function getViewList(){

        const url = INSIGHT_END_POINT + '/list';

        makeApiCall(
            {
                method: 'get',
                url: url,
                successCallback: function(data){
                     
                    insight = data?.data?.data;
                    loadInsight(insight);
                },
                errorCallback: function(error){
                    console.error("Failed to load insight data:", error);
                    showNotification('Failed to load insight data', 'error');
                }
            }
        );
    }

    function getExamsList(){
        const url = INSIGHT_END_POINT + '/all-exam';
        makeApiCall(
            {
                method: 'get',
                url: url,
                successCallback: function(data){
                     
                    exams = data.data;
                },
                errorCallback: function(error){
                    console.error("Failed to load exams data:", error);
                }
            }
        );
    }

    function fetchExamTagsData(selectedExamIds) {
        if (selectedExamIds.length === 0) {
            return;
        }

        const url = INSIGHT_END_POINT + '/exam-tag';
        makeApiCall({
            method: 'put',
            url: url,
            data: JSON.stringify({
                examsIds: selectedExamIds
            }),
            successCallback: function(data){
                examTagsData = data?.data?.exams || [];
                
                // If we're in edit mode, mark previously selected tags
                if (isEditMode && examTagsData.length > 0) {
                    // Handle existing selections in edit mode
                    const currentSelectedTags = [...selectedTags];
                    
                    examTagsData.forEach(examData => {
                        // Check if we already have this exam's tags selected
                        const hasExistingTags = currentSelectedTags.some(tag => tag.examId === examData.examId);
                        
                        if (hasExistingTags) {
                            // Keep existing selections
                            examData.tags.forEach(tag => {
                                tag.isSelected = currentSelectedTags.some(t => 
                                    t.examId === examData.examId && t.tagId === tag.tagId
                                );
                            });
                        } else {
                            // For new exams, select all tags by default
                            examData.tags.forEach(tag => {
                                tag.isSelected = true;
                            });
                        }
                    });
                } else {
                    // Not in edit mode - mark all tags as selected by default for all exams
                    examTagsData.forEach(examData => {
                        examData.tags.forEach(tag => {
                            tag.isSelected = true;
                        });
                    });
                }
                
                populateTagSelection(examTagsData);
            },
            errorCallback: function(error){
                console.error("Failed to load exam tags data:", error);
                showNotification('Failed to load exam tags data', 'error');
            }
        });
    }
    
    // TAG MANAGEMENT FUNCTIONALITY
    
    // Toggle the tags drawer
    $('#manage-tags-btn').on('click', function() {
        $('#manageTagsDrawer').addClass('open');
        $('body').append('<div class="drawer-overlay"></div>');
        setTimeout(() => {
            $('.drawer-overlay').addClass('show');
        }, 10);
    });
    
    $('#closeTagsDrawer').on('click', function() {
        $('.drawer-overlay').removeClass('show');
        setTimeout(() => {
            $('#manageTagsDrawer').removeClass('open');
            $('.drawer-overlay').remove();
        }, 300);
    });

    
    
    // Add new tag functionality
    $('#addNewTag').on('click', function() {
        const newTagName = $('#newTagName').val().trim();
        
        if (newTagName === '') {
            showNotification('Tag name cannot be empty', 'error');
            return;
        }
        
        // Check if tag with same name already exists
        if (allTags.some(tag => 
            (tag.name && tag.name.toLowerCase() === newTagName.toLowerCase()) || 
            (tag.tagName && tag.tagName.toLowerCase() === newTagName.toLowerCase())
        )) {
            showNotification('A tag with this name already exists', 'error');
            return;
        }
        
        createNewTag(newTagName);
    });
    
    // Allow Enter key to submit new tag
    $('#newTagName').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            $('#addNewTag').click();
        }
    });
    
    // Create a new tag
    function createNewTag(tagName) {
        const url = TAG_END_POINT;
        
        makeApiCall({
            method: 'post',
            url: url,
            data: JSON.stringify({
                name: tagName
            }),
            successCallback: function(response) {
                // Clear the input field
                $('#newTagName').val('');
                
                if (response && response.data) {
                    const newTag = response.data;
                    
                    // Add the new tag to the allTags array
                    allTags.push(newTag);
                    
                    // Refresh the tags display
                    loadAllTags(allTags);
                    
                    showNotification('Tag created successfully', 'success');
                }
            },
            errorCallback: function(error) {
                console.error("Failed to create tag:", error);
                showNotification('Failed to create tag', 'error');
            }
        });
    }
    
    // Search tags functionality
    $('#searchTags').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm.length === 0) {
            loadAllTags(allTags);
            return;
        }
        
        const filteredTags = allTags.filter(tag => 
            tag?.name?.toLowerCase()?.includes(searchTerm)
        );
        
        loadAllTags(filteredTags);
    });
    
    // Load all tags into the drawer
    function loadAllTags(tags) {
        const container = $('#tagsContainer');
        container.empty();
        
        if (tags.length === 0) {
            container.html(`
                <div class="no-tags-found">
                    <i class="fas fa-search"></i>
                    <p>No tags found</p>
                </div>
            `);
            return;
        }
        
        tags.forEach(tag => {
            // Handle different property names in the API response
            const tagId = tag?._id
            const tagName = tag?.name
            
            const tagItem = $(`
                <div class="tag-item" data-id="${tagId}">
                    <div class="tag-info">
                        <i class="fas fa-tag"></i>
                        <span class="tag-name">${tagName}</span>
                    </div>
                    <div class="tag-actions">
                        <button class="tag-edit" title="Edit Tag">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="tag-delete" title="Delete Tag">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `);
            
            tagItem.find('.tag-edit').on('click', function(e) {
                e.stopPropagation();
                const tagId = $(this).closest('.tag-item').data('id');
                const tagName = $(this).closest('.tag-item').find('.tag-name').text();
                showEditTagForm(tagId, tagName);
            });
            
            tagItem.find('.tag-delete').on('click', function(e) {
                e.stopPropagation();
                const tagId = $(this).closest('.tag-item').data('id');
                const tagName = $(this).closest('.tag-item').find('.tag-name').text();
                deleteTag(tagId, tagName);
            });
            
            container.append(tagItem);
        });
    }
    
    function showEditTagForm(tagId, tagName) {
        const tagItem = $(`.tag-item[data-id="${tagId}"]`);
        
        // Create edit form
        const editForm = $(`
            <div class="tag-edit-form" data-id="${tagId}">
                <input type="text" class="tag-edit-input" value="${tagName}">
                <div class="tag-edit-actions">
                    <button class="tag-save">Save</button>
                    <button class="tag-cancel">Cancel</button>
                </div>
            </div>
        `);
        
        editForm.find('.tag-save').on('click', function() {
            const newTagName = editForm.find('.tag-edit-input').val().trim();
            
            if (newTagName === '') {
                showNotification('Tag name cannot be empty', 'error');
                return;
            }
            
            updateTag(tagId, newTagName);
            editForm.remove();
            tagItem.show();
        });
        
        editForm.find('.tag-cancel').on('click', function() {
            editForm.remove();
            tagItem.show();
        });
        
        // Insert form before the tag item and hide the tag item
        tagItem.before(editForm);
        tagItem.hide();
    }
    
    function updateTag(tagId, newTagName) {
        const url = TAG_END_POINT+`?tagId=${tagId}`;
        
        makeApiCall({
            method: 'put',
            url: url,
            data: JSON.stringify({
                _id: tagId,
                name: newTagName
            }),
            successCallback: function(response) {
                const tagItem = $(`.tag-item[data-id="${tagId}"]`);
                tagItem.find('.tag-name').text(newTagName);
                
                const tagIndex = allTags.findIndex(tag => tag._id === tagId);
                if (tagIndex !== -1) {
                    allTags[tagIndex].name = newTagName;
                }
                
                showNotification('Tag updated successfully', 'success');
            },
            errorCallback: function(error) {
                console.error("Failed to update tag:", error);
                showNotification('Failed to update tag', 'error');
            }
        });
    }
    
    // Delete a tag
    function deleteTag(tagId, tagName) {
        // Show confirmation dialog
        if (confirm(`Are you sure you want to delete the tag "${tagName}"? This may affect existing exams.`)) {
            const url = TAG_END_POINT + `?tagId=${tagId}`;
            
            makeApiCall({
                method: 'delete',
                url: url,
                successCallback: function(response) {
                    // Remove the tag from the UI with animation
                    const tagItem = $(`.tag-item[data-id="${tagId}"]`);
                    tagItem.fadeOut(300, function() {
                        $(this).remove();
                        
                        // If no tags left, show "No tags found" message
                        if ($('#tagsContainer').children().length === 0) {
                            $('#tagsContainer').html(`
                                <div class="no-tags-found">
                                    <i class="fas fa-search"></i>
                                    <p>No tags found</p>
                                </div>
                            `);
                        }
                    });
                    
                    allTags = allTags.filter(tag => tag._id !== tagId);
                    
                    showNotification('Tag deleted successfully', 'success');
                },
                errorCallback: function(error) {
                    console.error("Failed to delete tag:", error);
                    showNotification('Failed to delete tag', 'error');
                }
            });
        }
    }
    
    // Get all tags
    function getAllTags() {
        const url = TAG_END_POINT;
        
        makeApiCall({
            method: 'get',
            url: url,
            successCallback: function(response) {
                if (response && response.data) {
                    allTags = response.data;
                    loadAllTags(allTags);
                }
            },
            errorCallback: function(error) {
                console.error("Failed to load tags:", error);
                showNotification('Failed to load tags', 'error');
            }
        });
    }
    
});
