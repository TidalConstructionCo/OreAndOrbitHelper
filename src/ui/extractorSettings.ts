import type { Material } from '../api-access';
import type { AppState } from '../app/state';
import { getElementIdForMaterial } from './utils';

const settingsCache: Map<string, HTMLDivElement> = new Map();

export function renderExtractorSettingsNew(state: AppState, parent: HTMLElement): void {
  const visibleIds = new Set<string>();
  for (const entry of state.gameData.extractionData.data) {
    const materialId = entry.material;
    const material = state.gameData.materialData.data.find((mat) => mat.id === materialId);
    if (material === undefined) {
      continue;
    }
    const id = getElementIdForMaterial(materialId);
    const value = String(state.craftingTree.extractionYields[materialId] ?? 1);
    visibleIds.add(id);

    let container = settingsCache.get(id);
    if (container === undefined) {
      container = createExtractorSettingsElement(id, material, value);
      settingsCache.set(id, container);
    }
    updateContainer(container, material, id, value);

    if (container.parentElement !== parent) {
      parent.appendChild(container);
    }
  }

  for (const [id, view] of settingsCache) {
    if (!visibleIds.has(id)) {
      view.remove();
      settingsCache.delete(id);
    }
  }
}

// TODO: update and create duplicate a lot of logic, can we simplify this (e.g. by reusing update)?
function updateContainer(
  container: HTMLDivElement,
  material: Material,
  id: string,
  value: string,
): void {
  const label = container.querySelector<HTMLLabelElement>('label');
  const icon = container.querySelector<HTMLImageElement>('img');
  const input = container.querySelector<HTMLInputElement>(`#${id}`);
  const output = container.querySelector<HTMLOutputElement>(`#${id}-value`);
  if (label !== null && label.textContent !== material.name) {
    label.textContent = material.name;
  }
  if (icon !== null && icon.src !== material.icon) {
    icon.src = material.icon;
  }
  if (input !== null && document.activeElement !== input && input.value !== value) {
    input.value = value;
  }
  if (output !== null && output.textContent !== value) {
    output.textContent = value;
  }
}

function createExtractorSettingsElement(
  id: string,
  material: Material,
  value: string,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'extractor-setting';

  const labelContainer = document.createElement('div');

  const icon = document.createElement('img');
  icon.src = material.icon;
  icon.width = 16;
  icon.height = 16;
  labelContainer.appendChild(icon);

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = material.name;
  labelContainer.appendChild(label);

  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.name = material.id;
  input.min = '1';
  input.max = '10';
  input.step = '1';

  const output = document.createElement('output');
  output.id = `${id}-value`;
  output.textContent = value;

  wrapper.append(labelContainer, input, output);
  return wrapper;
}
