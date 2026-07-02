export const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return "";
};

export const validateUsername = (username) => {
  if (!username?.trim()) return "Username is required";
  if (username.trim().length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return "Username can only contain letters, numbers, and underscores";
  return "";
};

export const validateName = (name) => {
  if (!name?.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return "";
};

export const validatePostBody = (body) => {
  if (!body?.trim()) return "Post cannot be empty";
  if (body.trim().length > 5000) return "Post must be under 5000 characters";
  return "";
};

export const validateComment = (comment) => {
  if (!comment?.trim()) return "Comment cannot be empty";
  if (comment.trim().length > 1000) return "Comment must be under 1000 characters";
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
