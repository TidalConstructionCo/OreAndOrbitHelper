import { AppState } from '../app/newState';
import { getElementIdForMaterial } from './utils';

const settingsCache: Map<string, HTMLDivElement> = new Map();

export function renderExtractorSettingsNew(state: AppState, parent: HTMLElement): void {
  const visibleIds = new Set<string>();
  for (const entry of state.gameData.extractionData.data) {
    const material = entry.material;
    const id = getElementIdForMaterial(material);
    const value = String(state.craftingTree.extractionYields[material] ?? 1);
    visibleIds.add(id);

    let container = settingsCache.get(id);
    if (!container) {
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

function updateContainer(container: HTMLDivElement, material: string, id: string, value: string) {
  const label = container.querySelector<HTMLLabelElement>('label');
  const input = container.querySelector<HTMLInputElement>(`#${id}`);
  const output = container.querySelector<HTMLOutputElement>(`#${id}-value`);
  if (label && label.textContent !== material) {
    label.textContent = material;
  }
  if (input && document.activeElement !== input && input.value !== value) {
    input.value = value;
  }
  if (output && output.textContent !== value) {
    output.textContent = value;
  }
}

function createExtractorSettingsElement(
  id: string,
  material: string,
  value: string,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'extractor-setting';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = material;

  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.name = material;
  input.min = '1';
  input.max = '10';
  input.step = '1';

  const output = document.createElement('output');
  output.id = `${id}-value`;
  output.textContent = value;

  wrapper.append(label, input, output);
  return wrapper;
}
