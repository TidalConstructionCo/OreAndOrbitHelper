import { getElementIdForMaterial } from "./utils";

export function renderMaterialAvailability(
    availability: Record<string, number>
): void {
    for (const [material, amount] of Object.entries(availability)) {
        const output = document.getElementById(
            `${getElementIdForMaterial(material)}-value`
        );

        if (output) {
            output.textContent = String(amount);
        }
    }
}
