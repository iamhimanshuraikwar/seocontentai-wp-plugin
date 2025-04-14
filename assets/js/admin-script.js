jQuery(document).ready(function($) {
    // File input handling
    var $fileInput = $('#json_file');
    var $fileWrapper = $('.file-input-wrapper');
    var $fileDetails = $('#file-details');
    var $articleCount = $('#article-count');

    $fileInput.on('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        $articleCount.text(data.length);
                        $fileDetails.show();
                    } else {
                        throw new Error('Invalid JSON structure');
                    }
                } catch (error) {
                    alert('Error reading JSON file: ' + error.message);
                    resetForm();
                }
            };
            reader.readAsText(file);
        } else {
            resetForm();
        }
    });

    // Drag and drop functionality
    $fileWrapper.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragging');
    });

    $fileWrapper.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
    });

    $fileWrapper.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');

        var files = e.originalEvent.dataTransfer.files;
        if (files.length) {
            $fileInput[0].files = files;
            $fileInput.trigger('change');
        }
    });

    // Form submission
    $('#content-upload-form').on('submit', function(e) {
        e.preventDefault();

        if (!$('#post_category').val()) {
            alert('Please select a category');
            return;
        }

        var $form = $(this);
        var $submitButton = $form.find('button[type="submit"]');
        var $results = $('#upload-results');
        var $resultsContent = $results.find('.results-content');
        var $loaderWrapper = $('.loader-wrapper');
        var $progressBar = $('.progress-bar-fill');
        var $progressText = $('.progress-text');

        // Create FormData object
        var formData = new FormData();
        formData.append('action', 'upload_seo_content');
        formData.append('nonce', seoContentAIAjax.nonce);
        formData.append('json_file', $fileInput[0].files[0]);
        formData.append('post_status', $('#post_status').val());
        formData.append('post_category', $('#post_category').val());

        // Show loader
        $loaderWrapper.css('display', 'flex');
        $submitButton.prop('disabled', true);

        // (Optional) Reset progress
        $progressBar.css('width', '0%');
        $progressText.text('0% Complete');

        // Make AJAX request
        $.ajax({
            url: seoContentAIAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                handleUploadResponse(response, $results, $resultsContent);
            },
            error: function(xhr, status, error) {
                showError('Upload failed: ' + error);
            },
            complete: function() {
                $loaderWrapper.hide();
                $submitButton.prop('disabled', false);
            }
        });
    });

    function handleUploadResponse(response, $results, $resultsContent) {
        if (response.success) {
            var html = '<div class="notice notice-success">';
            html += '<p>Content processed and uploaded successfully!</p>';

            if (response.data.success.length > 0) {
                html += '<h4>Successfully created articles:</h4><ul>';
                response.data.success.forEach(function(post) {
                    html += '<li>' + escapeHtml(post.title);
                    html += ' <a href="/wp-admin/post.php?post=' + post.id + '&action=edit" target="_blank">(Edit)</a>';
                    html += '<span class="status-badge status-success">Success</span></li>';
                });
                html += '</ul>';
            }

            if (response.data.errors.length > 0) {
                html += '<h4>Processing Errors:</h4><ul>';
                response.data.errors.forEach(function(error) {
                    html += '<li>' + escapeHtml(error.title) + ' - ' + escapeHtml(error.error);
                    html += '<span class="status-badge status-error">Error</span></li>';
                });
                html += '</ul>';
            }

            html += '</div>';
            $resultsContent.html(html);
        } else {
            showError(response.data);
        }
        $results.show();
    }

    function showError(message) {
        $('#upload-results').show().find('.results-content').html(
            '<div class="notice notice-error">' +
            '<p>Error: ' + escapeHtml(message) + '</p>' +
            '</div>'
        );
    }

    function resetForm() {
        $fileWrapper.removeClass('has-file');
        $fileDetails.hide();
        $('#upload-results').hide();
        $articleCount.text('0');
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
