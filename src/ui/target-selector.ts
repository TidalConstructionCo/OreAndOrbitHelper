type TargetSelectorOptions = {
    select: HTMLSelectElement;
    materials: string[];
    selectedTarget: string;
    onTargetChanged: (target: string) => void;
};

export function initializeTargetSelector({
    select,
    materials,
    selectedTarget,
    onTargetChanged
}: TargetSelectorOptions): void {
    select.replaceChildren();

    for (const material of materials) {
        const option = document.createElement("option");
        option.value = material;
        option.textContent = material;
        select.appendChild(option);
    }

    select.value = selectedTarget;

    select.addEventListener("change", () => {
        onTargetChanged(select.value);
    });
}
