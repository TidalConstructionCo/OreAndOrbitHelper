export const API_KEY_STORAGE_KEY = 'apiKey';

export function getApiKey(): string | undefined {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? undefined;
}

export function initializeApiPageNew(
  onSubmit: (event: SubmitEvent) => void,
  onRemove: () => void,
): void {
  const form = document.querySelector<HTMLFormElement>('#apiKeyForm');
  const removeButton = document.querySelector<HTMLButtonElement>('#removeKeyButton');

  if (!form || !removeButton) {
    throw new Error('Required DOM elements were not found.');
  }

  form.addEventListener('submit', onSubmit);
  removeButton.addEventListener('click', onRemove);
}
