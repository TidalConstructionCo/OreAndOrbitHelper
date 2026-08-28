export function initializeToolTabs(): void {
    const buttons = document.querySelectorAll<HTMLElement>(".tool-button");
    const panels = document.querySelectorAll<HTMLElement>(".tool-panel");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const selectedTool = button.dataset.tool;

            buttons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            panels.forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.id === selectedTool
                );
            });
        });
    });
}
