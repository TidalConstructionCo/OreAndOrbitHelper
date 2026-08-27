import { getElementIdForMaterial } from "../main-script";

type ExtractorSettingsOptions = {
    container: HTMLElement;
    materials: string[];
    availability: Record<string, number>;
    onAvailabilityChanged: (
        material: string,
        value: number
    ) => void;
};

export function renderExtractorSettings({
    container,
    materials,
    availability,
    onAvailabilityChanged
}: ExtractorSettingsOptions): void {
    container.replaceChildren();

    for (const material of materials) {
        const id = getElementIdForMaterial(material);
        const value = availability[material] ?? 1;

        const wrapper = document.createElement("div");
        wrapper.className = "extractor-setting";

        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = material;

        const input = document.createElement("input");
        input.type = "range";
        input.id = id;
        input.name = material;
        input.min = "1";
        input.max = "10";
        input.step = "1";
        input.value = String(value);

        const output = document.createElement("output");
        output.id = `${id}-value`;
        output.textContent = String(value);

        input.addEventListener("input", () => {
            const nextValue = Number(input.value);
            output.textContent = String(nextValue);
            onAvailabilityChanged(material, nextValue);
        });

        wrapper.append(label, input, output);
        container.appendChild(wrapper);
    }
}
