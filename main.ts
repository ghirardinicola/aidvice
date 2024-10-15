import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';

class AdviceView extends ItemView {
  private content: string = '';

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    console.log('AdviceView constructed');
  }

  getViewType() {
    return "advice-view";
  }

  getDisplayText() {
    return "AIdvice";
  }

  async onOpen() {
    this.renderContent();
  }

  async setAdvice(advice: string) {
    console.log(`setAdvice called with: ${advice}`);
    this.content = advice;
    this.renderContent();
  }

  private renderContent() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h3", { text: "AIdvice" });
    container.createEl("p", { text: this.content });
  }
}

export default class AiPromptPlugin extends Plugin {
  private adviceView: AdviceView;

  async onload() {
    console.log('AiPromptPlugin onload started');

    this.registerView(
      "advice-view",
      (leaf) => {
        this.adviceView = new AdviceView(leaf);
        return this.adviceView;
      }
    );

    this.addRibbonIcon('bulb', 'Toggle AIdvice', () => {
      this.toggleAdviceView();
    });

    this.addCommand({
      id: 'toggle-writing-advice',
      name: 'Toggle AIdvice',
      callback: () => this.toggleAdviceView()
    });

    this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
      this.handleEditorChange();
    });

    this.app.workspace.onLayoutReady(() => {
      console.log('Layout ready, activating view');
      this.activateView();
    });

    console.log('AiPromptPlugin onload completed');
  }

  async toggleAdviceView() {
    console.log('Toggle advice view called');
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType("advice-view");

    if (existing.length) {
      console.log('Existing view found, closing');
      await workspace.detachLeavesOfType("advice-view");
    } else {
      console.log('No existing view, creating new one');
      await this.activateView();
    }
  }

  async activateView() {
    console.log('Activating view');
    const { workspace } = this.app;
    
    if (workspace.getLeavesOfType("advice-view").length === 0) {
      await workspace.getRightLeaf(false).setViewState({
        type: "advice-view",
        active: true,
      });
    }

    const leaf = workspace.getLeavesOfType("advice-view")[0];
    if (leaf) {
      workspace.revealLeaf(leaf);
      this.getWritingAdvice();
    } else {
      console.log('Failed to create or find advice view leaf');
    }
  }

  handleEditorChange() {
    console.log('Editor change detected');
    if (this.adviceView) {
      this.getWritingAdvice();
    } else {
      console.log('AdviceView not initialized');
    }
  }

  async getWritingAdvice() {
    console.log('Getting writing advice');
    const advice = await this.generateAdvice();
    if (this.adviceView) {
      this.adviceView.setAdvice(advice);
    } else {
      console.log('AdviceView is not initialized');
    }
  }

  async generateAdvice(): Promise<string> {
    const adviceOptions = [
      "Try describing the scene using all five senses.",
      "Consider writing from a different character's perspective.",
      "Explore a 'what if' scenario in your story.",
      "Take a moment to delve deeper into your protagonist's motivations.",
      "Reflect on how the current scene connects to your overall theme.",
    ];
    return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
  }
}