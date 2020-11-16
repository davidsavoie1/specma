export const defaultMessages = {
  isInvalid: "is invalid",
  isRequired: "is required",
};

export function getMessage(key, messages = defaultMessages) {
  return messages[key] || defaultMessages[key];
}

export function setMessages(messages = {}) {
  Object.assign(defaultMessages, messages);
}
