// Input validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Minimum 6 characters
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};

export const validateName = (name) => {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (trimmedName.length > 50) {
    return { valid: false, message: 'Name must not exceed 50 characters' };
  }
  return { valid: true };
};

export const validateSignupInput = (data) => {
  const errors = {};

  // Validate name
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  } else {
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.message;
    }
  }

  // Validate email
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginInput = (data) => {
  const errors = {};

  // Validate email
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTripData = (data) => {
  const errors = {};

  if (!data.userId) {
    errors.userId = 'User ID is required';
  }

  if (!data.origin || !data.origin.name || !data.origin.coordinates) {
    errors.origin = 'Valid origin with coordinates is required';
  }

  if (!data.destination || !data.destination.name || !data.destination.coordinates) {
    errors.destination = 'Valid destination with coordinates is required';
  }

  if (!data.selectedRoute) {
    errors.selectedRoute = 'Selected route is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
