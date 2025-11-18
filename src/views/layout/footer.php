    </div> <!-- container -->

    <!-- Footer -->
    <footer class="mt-5 py-4 bg-light text-center">
        <div class="container">
            <p class="text-muted mb-0">
                &copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?> v<?php echo APP_VERSION; ?>
                | KAIST Touch Math Academy
            </p>
        </div>
    </footer>

    <!-- jQuery and Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Timer functionality for problems
        let startTime = Date.now();

        function getTimeSpent() {
            return Math.floor((Date.now() - startTime) / 1000);
        }

        // Auto-save draft functionality
        function enableAutoSave(formId, saveUrl, interval = 30000) {
            setInterval(function() {
                const formData = $(formId).serialize() + '&auto_save=1';
                $.post(saveUrl, formData, function(response) {
                    console.log('Auto-saved at', new Date().toLocaleTimeString());
                });
            }, interval);
        }

        // Confirmation before leaving page with unsaved changes
        let formChanged = false;
        $('form').on('change input', function() {
            formChanged = true;
        });

        $('form').on('submit', function() {
            formChanged = false;
        });

        window.addEventListener('beforeunload', function(e) {
            if (formChanged) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    </script>

    <?php if (isset($additionalScripts)): ?>
        <?php echo $additionalScripts; ?>
    <?php endif; ?>
</body>
</html>
