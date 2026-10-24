// API utility for making requests to the backend
// Handles standard response format and errors

import { hasActiveAiJob, getActiveAiJobSignal } from './utils.js';
import { request, responseError } from './http-client.js';
export { ApiError, getCsrfToken, refreshCsrfToken } from './http-client.js';

/**
 * Standard API request wrapper
 * Handles authentication, CSRF, and error responses
 */
export async function apiFetch(path, options = {}) {
  if (options.method?.toUpperCase() === 'POST' && /\/(rpp|kisi|analisis-cp|program-sekolah|presentation|tts|surat|proker|laporan)\/(generate(?:-section)?|outline|patch-slide|custom)(?:$|\?)/.test(path) && hasActiveAiJob() && options.signal !== getActiveAiJobSignal()) {
    throw new Error('Tinjau hasil atau selesaikan proses AI yang masih terbuka terlebih dahulu.');
  }
  return request(path, options);
}

export async function api(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json();
  if (data.success === false) throw responseError(data, response.status);
  return data;
}


/**
 * Shorthand methods for common HTTP verbs
 */
export const apiGet = (path) => api(path, { method: 'GET' });

export const apiPost = (path, body) => api(path, {
    method: 'POST',
    body
});

export const apiPut = (path, body) => api(path, {
    method: 'PUT',
    body
});

export const apiDelete = (path) => api(path, { method: 'DELETE' });

// Convenience properties on api function directly (supports api.post(url, data))
api.get = (path, options = {}) => api(path, { ...options, method: 'GET' });
api.post = (path, body, options = {}) => api(path, { ...options, method: 'POST', body });
api.put = (path, body, options = {}) => api(path, { ...options, method: 'PUT', body });
api.delete = (path, options = {}) => api(path, { ...options, method: 'DELETE' });

/**
 * Validation helpers for forms
 */
export const validators = {
    required: (value, fieldName = 'Field') => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} harus diisi`;
        }
        return null;
    },

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Format email tidak valid';
        }
        return null;
    },

    minLength: (value, min, fieldName = 'Field') => {
        if (value && value.length < min) {
            return `${fieldName} minimal ${min} karakter`;
        }
        return null;
    },

    password: (value) => {
        if (!value || value.length < 8) {
            return 'Password minimal 8 karakter';
        }
        if (!/[a-zA-Z]/.test(value)) {
            return 'Password harus mengandung huruf';
        }
        if (!/[0-9]/.test(value)) {
            return 'Password harus mengandung angka';
        }
        return null;
    },

    match: (value1, value2, message = 'Nilai tidak cocok') => {
        if (value1 !== value2) {
            return message;
        }
        return null;
    },

    date: (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return 'Format tanggal tidak valid (gunakan YYYY-MM-DD)';
        }
        return null;
    }
};

/**
 * Validate form data against rules
 * @param {Object} data - Form data object
 * @param {Object} rules - Validation rules { fieldName: [validatorFn, validatorFn, ...] }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateForm(data, rules) {
    const errors = {};
    let valid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
        // Ensure field exists in data, defaults to empty string if undefined
        const value = data[field] !== undefined ? data[field] : '';

        // Handle single validator or array of validators
        const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

        for (const rule of rulesArray) {
            if (typeof rule !== 'function') continue;

            const error = rule(value);
            if (error) {
                errors[field] = error;
                valid = false;
                break; // Only show first error per field
            }
        }
    }

    return { valid, errors };
}

/**
 * Display form errors
 */
export function showFormErrors(errors, formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Clear previous errors
    form.querySelectorAll(`.error-message`).forEach(el => el.remove());
    form.querySelectorAll(`.input-error`).forEach(el => el.classList.remove('input-error'));
    form.querySelectorAll(`.border-red-500`).forEach(el => el.classList.remove('border-red-500'));

    for (const [field, message] of Object.entries(errors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('border-red-500', 'focus:ring-red-200', 'focus:border-red-500');

            const errorEl = document.createElement('p');
            errorEl.className = 'error-message text-red-500 text-xs mt-1';
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;

            // Insert after input but handle input groups
            if (input.parentNode.classList.contains('relative')) {
                input.parentNode.parentNode.appendChild(errorEl);
            } else {
                input.parentNode.appendChild(errorEl);
            }
        }
    }
}

/**
 * Clear form errors
 */
export function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll(`.error-message`).forEach(el => el.remove());
    form.querySelectorAll(`.border-red-500`).forEach(el => el.classList.remove('border-red-500', 'focus:ring-red-200', 'focus:border-red-500'));
}
