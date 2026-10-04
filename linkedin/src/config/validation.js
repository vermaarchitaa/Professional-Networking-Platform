export const validateEmail = (email) => {
  if (!email?.trim()) return "emailRequired";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "emailInvalid";
  return "";
};

export const validateOptionalEmail = (email) => {
  if (!email?.trim()) return "";
  return validateEmail(email);
};

export const validatePassword = (password) => {
  if (!password) return "passwordRequired";
  if (password.length < 6) return "passwordMin";
  return "";
};

export const validateUsername = (username) => {
  if (!username?.trim()) return "usernameRequired";
  if (username.trim().length < 3) return "usernameMin";
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return "usernameInvalid";
  return "";
};

export const validateName = (name) => {
  if (!name?.trim()) return "nameRequired";
  if (name.trim().length < 2) return "nameMin";
  return "";
};

export const validatePostBody = (body) => {
  if (!body?.trim()) return "postEmpty";
  if (body.trim().length > 5000) return "postTooLong";
  return "";
};

export const validateComment = (comment) => {
  if (!comment?.trim()) return "commentEmpty";
  if (comment.trim().length > 1000) return "commentTooLong";
  return "";
};

export const validateProfile = ({ name, username, email }) => {
  const errors = {};
  const nameErr = validateName(name);
  const usernameErr = validateUsername(username);
  const emailErr = validateEmail(email);
  if (nameErr) errors.name = nameErr;
  if (usernameErr) errors.username = usernameErr;
  if (emailErr) errors.email = emailErr;
  return errors;
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  const emailErr = validateEmail(email);
  const passwordErr = validatePassword(password);
  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  return errors;
};

export const validateRegister = ({ name, username, email, password }) => {
  const errors = {};
  const nameErr = validateName(name);
  const usernameErr = validateUsername(username);
  const emailErr = validateEmail(email);
  const passwordErr = validatePassword(password);
  if (nameErr) errors.name = nameErr;
  if (usernameErr) errors.username = usernameErr;
  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  return errors;
};
