/**
 * FastBB Installation Wizard JavaScript
 */

let currentStep = 1;
const totalSteps = 5;

// DOM Elements
const wizardForm = document.getElementById('wizard-form');
const steps = document.querySelectorAll('.wizard-step');
const progressSteps = document.querySelectorAll('.progress-step');

/**
 * Initialize the wizard
 */
function initWizard() {
    checkSystem();
}

/**
 * Check system requirements
 */
function checkSystem() {
    // Check PHP version
    const phpCheck = document.getElementById('req-php-status');
    phpCheck.textContent = 'Checking...';
    phpCheck.className = 'req-status';

    // Simulate system check (in production, this would make AJAX calls)
    setTimeout(() => {
        phpCheck.textContent = '✓ PHP 7.4+ available';
        phpCheck.className = 'req-status pass';

        // Check SQLite
        const sqliteCheck = document.getElementById('req-sqlite-status');
        sqliteCheck.textContent = '✓ SQLite available';
        sqliteCheck.className = 'req-status pass';

        // Check writable directory
        const writableCheck = document.getElementById('req-writable-status');
        writableCheck.textContent = '✓ Data directory writable';
        writableCheck.className = 'req-status pass';

        // Check GD
        const gdCheck = document.getElementById('req-gd-status');
        gdCheck.textContent = '✓ GD extension available';
        gdCheck.className = 'req-status pass';

        // Enable next button
        const nextBtn = document.querySelector('[data-step="1"] .btn-primary');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Next';
    }, 800);
}

/**
 * Navigate to the next step
 */
function nextStep() {
    if (currentStep < totalSteps) {
        steps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.add('completed');

        currentStep++;
        steps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.remove('completed');
    }
}

/**
 * Navigate to the previous step
 */
function prevStep() {
    if (currentStep > 1) {
        steps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.add('completed');

        currentStep--;
        steps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.remove('completed');
    }
}

/**
 * Handle template selection
 */
function selectTemplate(templateName) {
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        if (card.querySelector('input').value === templateName) {
            card.classList.add('selected');
            card.querySelector('input').checked = true;
        } else {
            card.classList.remove('selected');
            card.querySelector('input').checked = false;
        }
    });
}

/**
 * Handle form submission
 */
function handleSubmit() {
    const form = document.getElementById('wizard-form');
    const adminUsername = document.getElementById('admin_username').value;
    const adminEmail = document.getElementById('admin_email').value;
    const adminPassword = document.getElementById('admin_password').value;
    const adminPasswordConfirm = document.getElementById('admin_password_confirm').value;

    // Validation
    if (adminPassword !== adminPasswordConfirm) {
        alert('Passwords do not match!');
        return;
    }

    if (adminPassword.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }

    // Get selected template
    const selectedTemplate = document.querySelector('input[name="template"]:checked').value;

    // Simulate installation
    const btn = form.querySelector('.btn-primary');
    btn.textContent = 'Installing...';
    btn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Update installation info
        document.getElementById('install-url').textContent = window.location.protocol + '//' + window.location.host;

        // Navigate to success screen
        steps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.add('completed');

        currentStep = 5;
        steps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.add('active');

        btn.textContent = 'Complete';
        btn.disabled = false;
    }, 1500);
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Template selection
    const templateRadios = document.querySelectorAll('input[name="template"]');
    templateRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectTemplate(e.target.value);
        });
    });

    // Next button on last step
    const installBtn = document.querySelector('.wizard-step[data-step="5"] .btn-primary');
    if (installBtn) {
        installBtn.addEventListener('click', handleSubmit);
    }

    // Install demo checkbox
    const demoCheckbox = document.getElementById('install_demo');
    if (demoCheckbox) {
        demoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log('Demo data will be installed');
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initWizard();
    initEventListeners();

    // Add click handlers for action buttons
    const wizardSteps = document.querySelectorAll('.wizard-step');
    wizardSteps.forEach(step => {
        const nextBtn = step.querySelector('.btn-primary');
        if (nextBtn && !nextBtn.onclick) {
            nextBtn.onclick = nextStep;
        }

        const backBtn = step.querySelector('.btn-secondary');
        if (backBtn && !backBtn.onclick) {
            backBtn.onclick = prevStep;
        }
    });
});

// Export for global access
window.checkSystem = checkSystem;
window.nextStep = nextStep;
window.prevStep = prevStep;
