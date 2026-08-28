const STORAGE_KEY = "apiKey";
const VISIBLE_CHARACTERS = 4;

export function getApiKey(): string | undefined {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
}

export function initialize(): void {
    const form = document.querySelector<HTMLFormElement>("#apiKeyForm");
    const input = document.querySelector<HTMLInputElement>("#apiKeyInput");
    const storedKeyContainer =
        document.querySelector<HTMLDivElement>("#storedKey");
    const keyValue = document.querySelector<HTMLElement>("#keyValue");
    const removeButton =
        document.querySelector<HTMLButtonElement>("#removeKeyButton");

    if (
        !form ||
        !input ||
        !storedKeyContainer ||
        !keyValue ||
        !removeButton
    ) {
        throw new Error("Required DOM elements were not found.");
    }

    function obfuscateApiKey(apiKey: string): string {
        if (apiKey.length <= VISIBLE_CHARACTERS) {
            return "•".repeat(apiKey.length);
        }

        const hiddenCharacters = "•".repeat(
            apiKey.length - VISIBLE_CHARACTERS
        );

        const visibleSuffix = apiKey.slice(-VISIBLE_CHARACTERS);

        return `${hiddenCharacters}${visibleSuffix}`;
    }

    function displayStoredKey(): void {
        const apiKey: string | null = localStorage.getItem(STORAGE_KEY);
        const hasStoredKey: boolean = Boolean(apiKey);

        storedKeyContainer.hidden = !hasStoredKey;
        removeButton.hidden = !hasStoredKey;

        if (apiKey) {
            keyValue.textContent = obfuscateApiKey(apiKey);
        } else {
            keyValue.textContent = "";
        }
    }

    form.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();

        const apiKey: string = input.value.trim();

        if (!apiKey) {
            return;
        }

        localStorage.setItem(STORAGE_KEY, apiKey);

        input.value = "";
        displayStoredKey();
    });

    removeButton.addEventListener("click", (): void => {
        const confirmed: boolean = window.confirm(
            "Are you sure you want to remove the stored API key?"
        );

        if (confirmed) {
            localStorage.removeItem(STORAGE_KEY);
            displayStoredKey();
        }
    });

    displayStoredKey();

}