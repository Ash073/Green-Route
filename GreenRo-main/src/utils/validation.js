// Client-side validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return {
    valid: emailRegex.test(email),
    message: 'Please enter a valid email address'
  };
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters'
    };
  }
  if (password.length > 50) {
    return {
      valid: false,
      message: 'Password must not exceed 50 characters'
    };
  }
  return { valid: true };
};

export const validateName = (name) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return {
      valid: false,
      message: 'Name must be at least 2 characters'
    };
  }
  if (trimmed.length > 50) {
    return {
      valid: false,
      message: 'Name must not exceed 50 characters'
    };
  }
  return { valid: true };
};

export const validateLoginForm = (email, password) => {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.message;
    }
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSignupForm = (name, email, password, confirmPassword) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Name is required';
  } else {
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.message;
    }
  }

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.message;
    }
  }

  if (!password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message;
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTripForm = (origin, destination) => {
  const errors = {};

  if (!origin || !origin.trim()) {
    errors.origin = 'Origin is required';
  }

  if (!destination || !destination.trim()) {
    errors.destination = 'Destination is required';
  }

  if (origin && destination && origin.trim() === destination.trim()) {
    errors.destination = 'Origin and destination must be different';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// Field-level validation
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'name':
      return validateName(value);
    default:
      return { valid: true };
  }
};
