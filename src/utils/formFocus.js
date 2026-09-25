export const focusFirstInvalidField = (formRef, errors) => {
  const firstField = Object.keys(errors)[0];

  if (!firstField || typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    formRef.current?.elements.namedItem(firstField)?.focus?.();
  }, 0);
};
