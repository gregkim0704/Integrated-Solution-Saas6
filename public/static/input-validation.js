/**
 * 🛡️ 프론트엔드 실시간 입력 검증 시스템
 * 
 * 사용자가 입력하는 실시간으로 검증을 수행하고 즉각적인 피드백을 제공합니다.
 * 백엔드 검증과 동일한 로직을 사용하여 일관성을 보장합니다.
 * 
 * @author 한국인프라연구원(주)
 * @contact infrastructure@kakao.com  
 * @phone 010-9143-0800
 */

class FrontendInputSanitizer {
  // XSS 방지: HTML 태그 및 스크립트 제거
  static sanitizeHtml(input) {
    if (!input || typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    let sanitized = div.innerHTML;
    
    // 추가 보안 처리
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
    
    return sanitized.trim();
  }

  // 일반 텍스트 살균
  static sanitizeText(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  // 이메일 살균
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .replace(/[^\w@.-]/g, '')
      .trim();
  }

  // 전화번호 살균
  static sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^\d-+() ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

class FrontendInputValidator {
  static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  static readonly PHONE_PATTERN = /^[\d\-\+\(\)\s]{10,20}$/;

  // 비밀번호 강도 검증
  static validatePassword(password) {
    const errors = [];
    
    if (!password) {
      return {isValid: false, errors: ['비밀번호는 필수입니다.'], strength: 0};
    }
    
    let strength = 0;
    
    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    } else {
      strength += 20;
    }
    
    if (/[A-Z]/.test(password)) {
      strength += 20;
    } else {
      errors.push('대문자를 포함해야 합니다.');
    }
    
    if (/[a-z]/.test(password)) {
      strength += 20;
    } else {
      errors.push('소문자를 포함해야 합니다.');
    }
    
    if (/[0-9]/.test(password)) {
      strength += 20;
    } else {
      errors.push('숫자를 포함해야 합니다.');
    }
    
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      strength += 20;
    } else {
      errors.push('특수문자를 포함해야 합니다.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: Math.min(strength, 100)
    };
  }

  // 단일 필드 검증
  static validateField(value, rule, fieldName) {
    const result = {
      isValid: true,
      error: null,
      sanitizedValue: value,
      warning: null
    };

    // Required 검증
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      result.isValid = false;
      result.error = `${fieldName}은(는) 필수 항목입니다.`;
      return result;
    }

    // 값이 없고 required가 아닌 경우 통과
    if (!value && !rule.required) {
      return result;
    }

    // 타입별 검증 및 살균
    switch (rule.type) {
      case 'email':
        result.sanitizedValue = FrontendInputSanitizer.sanitizeEmail(value);
        if (!this.EMAIL_PATTERN.test(result.sanitizedValue)) {
          result.isValid = false;
          result.error = `올바른 이메일 주소를 입력해주세요.`;
        }
        break;

      case 'url':
        if (value && !this.URL_PATTERN.test(value)) {
          result.isValid = false;
          result.error = `올바른 URL을 입력해주세요.`;
        }
        break;

      case 'phone':
        result.sanitizedValue = FrontendInputSanitizer.sanitizePhone(value);
        if (result.sanitizedValue && !this.PHONE_PATTERN.test(result.sanitizedValue)) {
          result.isValid = false;
          result.error = `올바른 전화번호를 입력해주세요.`;
        }
        break;

      case 'password':
        const passwordResult = this.validatePassword(value);
        result.isValid = passwordResult.isValid;
        if (!passwordResult.isValid) {
          result.error = passwordResult.errors[0];
        }
        result.passwordStrength = passwordResult.strength;
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          result.isValid = false;
          result.error = `${fieldName}은(는) 숫자여야 합니다.`;
        } else {
          result.sanitizedValue = numValue;
        }
        break;

      default:
        if (typeof value === 'string') {
          result.sanitizedValue = FrontendInputSanitizer.sanitizeText(value, rule.maxLength);
        }
    }

    // 길이 검증
    if (typeof result.sanitizedValue === 'string') {
      if (rule.minLength && result.sanitizedValue.length < rule.minLength) {
        result.isValid = false;
        result.error = `최소 ${rule.minLength}자 이상 입력해주세요.`;
      }
      if (rule.maxLength && result.sanitizedValue.length > rule.maxLength) {
        result.isValid = false;
        result.error = `최대 ${rule.maxLength}자까지 입력 가능합니다.`;
      }
      
      // 길이 경고
      if (rule.maxLength && result.sanitizedValue.length > rule.maxLength * 0.9) {
        result.warning = `${rule.maxLength - result.sanitizedValue.length}자 남음`;
      }
    }

    // 패턴 검증
    if (rule.pattern && typeof result.sanitizedValue === 'string') {
      if (!rule.pattern.test(result.sanitizedValue)) {
        result.isValid = false;
        result.error = `${fieldName}의 형식이 올바르지 않습니다.`;
      }
    }

    return result;
  }
}

/**
 * 🎨 실시간 UI 검증 피드백 시스템
 */
class ValidationUI {
  // 검증 결과에 따라 입력 필드 스타일 업데이트
  static updateFieldStatus(fieldElement, validationResult) {
    const container = fieldElement.closest('.input-container') || fieldElement.parentElement;
    
    // 기존 상태 클래스 제거
    fieldElement.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500');
    container.querySelectorAll('.validation-message').forEach(msg => msg.remove());
    
    if (validationResult.isValid) {
      // 성공 상태
      fieldElement.classList.add('border-green-500');
      
      if (validationResult.warning) {
        this.showMessage(container, validationResult.warning, 'warning');
      }
    } else {
      // 오류 상태
      fieldElement.classList.add('border-red-500');
      
      if (validationResult.error) {
        this.showMessage(container, validationResult.error, 'error');
      }
    }

    // 비밀번호 강도 표시
    if (validationResult.passwordStrength !== undefined) {
      this.updatePasswordStrength(container, validationResult.passwordStrength);
    }
  }

  // 메시지 표시
  static showMessage(container, message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `validation-message text-sm mt-1 ${
      type === 'error' ? 'text-red-600' : 
      type === 'warning' ? 'text-yellow-600' : 'text-green-600'
    }`;
    messageElement.textContent = message;
    
    container.appendChild(messageElement);
  }

  // 비밀번호 강도 표시
  static updatePasswordStrength(container, strength) {
    let strengthBar = container.querySelector('.password-strength');
    
    if (!strengthBar) {
      strengthBar = document.createElement('div');
      strengthBar.className = 'password-strength mt-2';
      strengthBar.innerHTML = `
        <div class="text-sm text-gray-600 mb-1">비밀번호 강도</div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="strength-fill h-2 rounded-full transition-all duration-300"></div>
        </div>
        <div class="strength-text text-xs mt-1"></div>
      `;
      container.appendChild(strengthBar);
    }
    
    const fill = strengthBar.querySelector('.strength-fill');
    const text = strengthBar.querySelector('.strength-text');
    
    fill.style.width = `${strength}%`;
    
    if (strength < 40) {
      fill.className = 'strength-fill h-2 rounded-full transition-all duration-300 bg-red-500';
      text.textContent = '약함';
      text.className = 'strength-text text-xs mt-1 text-red-600';
    } else if (strength < 70) {
      fill.className = 'strength-fill h-2 rounded-full transition-all duration-300 bg-yellow-500';
      text.textContent = '보통';
      text.className = 'strength-text text-xs mt-1 text-yellow-600';
    } else {
      fill.className = 'strength-fill h-2 rounded-full transition-all duration-300 bg-green-500';
      text.textContent = '강함';
      text.className = 'strength-text text-xs mt-1 text-green-600';
    }
  }

  // 글자 수 표시
  static updateCharCount(fieldElement, rule) {
    const container = fieldElement.closest('.input-container') || fieldElement.parentElement;
    let counter = container.querySelector('.char-counter');
    
    if (rule.maxLength) {
      if (!counter) {
        counter = document.createElement('div');
        counter.className = 'char-counter text-xs text-gray-500 mt-1';
        container.appendChild(counter);
      }
      
      const currentLength = fieldElement.value.length;
      counter.textContent = `${currentLength}/${rule.maxLength}`;
      
      if (currentLength > rule.maxLength * 0.9) {
        counter.className = 'char-counter text-xs text-yellow-600 mt-1';
      } else if (currentLength >= rule.maxLength) {
        counter.className = 'char-counter text-xs text-red-600 mt-1';
      } else {
        counter.className = 'char-counter text-xs text-gray-500 mt-1';
      }
    }
  }
}

/**
 * 📋 프론트엔드 검증 스키마 (백엔드와 동일)
 */
const FrontendValidationSchemas = {
  userSignup: {
    email: {
      required: true,
      type: 'email',
      maxLength: 255
    },
    password: {
      required: true,
      type: 'password'
    },
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: /^[가-힣a-zA-Z\s]+$/
    },
    company: {
      required: false,
      type: 'string',
      maxLength: 200
    },
    industry: {
      required: false,
      type: 'string',
      maxLength: 100
    }
  },

  userLogin: {
    email: {
      required: true,
      type: 'email'
    },
    password: {
      required: true,
      type: 'string',
      minLength: 1
    }
  },

  contentGeneration: {
    productDescription: {
      required: true,
      type: 'string',
      minLength: 10,
      maxLength: 5000
    }
  }
};

/**
 * 🚀 자동 검증 바인딩 시스템
 */
class ValidationBinder {
  constructor() {
    this.boundFields = new Map();
    this.debounceTimers = new Map();
  }

  // 입력 필드에 검증 바인딩
  bindField(fieldElement, rule, fieldName) {
    const validate = () => {
      const result = FrontendInputValidator.validateField(
        fieldElement.value, 
        rule, 
        fieldName
      );
      
      ValidationUI.updateFieldStatus(fieldElement, result);
      ValidationUI.updateCharCount(fieldElement, rule);
      
      return result;
    };

    // 실시간 검증 (디바운스 적용)
    const handleInput = () => {
      // 기존 타이머 취소
      if (this.debounceTimers.has(fieldElement)) {
        clearTimeout(this.debounceTimers.get(fieldElement));
      }
      
      // 새 타이머 설정
      const timer = setTimeout(validate, 300);
      this.debounceTimers.set(fieldElement, timer);
    };

    // 포커스 아웃 시 즉시 검증
    const handleBlur = () => {
      // 디바운스 타이머 취소하고 즉시 검증
      if (this.debounceTimers.has(fieldElement)) {
        clearTimeout(this.debounceTimers.get(fieldElement));
        this.debounceTimers.delete(fieldElement);
      }
      validate();
    };

    fieldElement.addEventListener('input', handleInput);
    fieldElement.addEventListener('blur', handleBlur);
    
    this.boundFields.set(fieldElement, { rule, fieldName, validate });
  }

  // 폼 전체 검증
  validateForm(formElement, schema) {
    let isValid = true;
    const errors = {};
    const sanitizedData = {};

    for (const [fieldName, rule] of Object.entries(schema)) {
      const fieldElement = formElement.querySelector(`[name="${fieldName}"]`);
      
      if (fieldElement) {
        const result = FrontendInputValidator.validateField(
          fieldElement.value,
          rule,
          fieldName
        );
        
        ValidationUI.updateFieldStatus(fieldElement, result);
        
        if (!result.isValid) {
          isValid = false;
          errors[fieldName] = result.error;
        } else {
          sanitizedData[fieldName] = result.sanitizedValue;
        }
      }
    }

    return {
      isValid,
      errors,
      sanitizedData
    };
  }

  // 자동 바인딩 (data-validate 속성 기반)
  autoBindForm(formElement) {
    const fieldsWithValidation = formElement.querySelectorAll('[data-validate]');
    
    fieldsWithValidation.forEach(fieldElement => {
      const validateType = fieldElement.getAttribute('data-validate');
      const fieldName = fieldElement.getAttribute('name') || fieldElement.id;
      
      // 스키마에서 해당 필드 찾기
      let rule = null;
      for (const schema of Object.values(FrontendValidationSchemas)) {
        if (schema[fieldName]) {
          rule = schema[fieldName];
          break;
        }
      }
      
      // 타입 기반 기본 규칙
      if (!rule) {
        rule = this.getDefaultRule(validateType, fieldElement);
      }
      
      if (rule) {
        this.bindField(fieldElement, rule, fieldName);
      }
    });
  }

  // 기본 검증 규칙 생성
  getDefaultRule(validateType, fieldElement) {
    const isRequired = fieldElement.hasAttribute('required');
    const maxLength = fieldElement.getAttribute('maxlength');
    const minLength = fieldElement.getAttribute('minlength');
    
    const rule = {
      required: isRequired,
      type: validateType || 'string'
    };
    
    if (maxLength) rule.maxLength = parseInt(maxLength);
    if (minLength) rule.minLength = parseInt(minLength);
    
    return rule;
  }
}

// 전역 검증 인스턴스
window.validationBinder = new ValidationBinder();

// DOM 로드 완료 시 자동 바인딩
document.addEventListener('DOMContentLoaded', () => {
  // 모든 폼에 자동 바인딩
  document.querySelectorAll('form').forEach(form => {
    window.validationBinder.autoBindForm(form);
  });
});

// 동적으로 추가된 폼 요소를 위한 MutationObserver
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'FORM') {
          window.validationBinder.autoBindForm(node);
        } else {
          const forms = node.querySelectorAll && node.querySelectorAll('form');
          if (forms) {
            forms.forEach(form => window.validationBinder.autoBindForm(form));
          }
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 전역 검증 함수들 노출
window.FrontendInputValidator = FrontendInputValidator;
window.FrontendInputSanitizer = FrontendInputSanitizer;
window.ValidationUI = ValidationUI;
window.FrontendValidationSchemas = FrontendValidationSchemas;