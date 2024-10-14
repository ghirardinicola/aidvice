import { Plugin, WorkspaceLeaf, ItemView, TFile, MarkdownView, EditorChange, PluginSettingTab, App } from 'obsidian';

class AdviceView extends ItemView {
  private content: string = '';

  getViewType() {
    return "advice-view";
  }

  getDisplayText() {
    return "Writing Advice";
  }

  async onOpen() {
    this.renderContent();
  }

  async setAdvice(advice: string) {
    this.content = advice;
    this.renderContent();
  }

  private renderContent() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h3", { text: "Writing Advice" });
    container.createEl("p", { text: this.content });
  }
}

export default class AiPromptPlugin extends Plugin {
  settings: AiPromptPluginSettings;
  private adviceView: AdviceView;
  private lastEditTime: number = 0;
  private adviceTimeout: NodeJS.Timeout | null = null;

  async onload() {
    await this.loadSettings();

    this.registerView(
      "advice-view",
      (leaf: WorkspaceLeaf) => (this.adviceView = new AdviceView(leaf))
    );

    this.addRibbonIcon('bulb', 'Toggle Writing Advice', () => {
      this.toggleAdviceView();
    });

    this.addCommand({
      id: 'toggle-writing-advice',
      name: 'Toggle Writing Advice',
      callback: () => this.toggleAdviceView()
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on('change', this.handleEditorChange.bind(this));
    });

    this.addSettingTab(new AiPromptSettingTab(this.app, this));

    this.activateView();
  }
  
  async toggleAdviceView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType("advice-view")[0];

    if (leaf) {
      await workspace.detachLeavesOfType("advice-view");
    } else {
      await this.activateView();
    }
  }

  async activateView() {
    const { workspace } = this.app;
    
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType("advice-view");

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: "advice-view", active: true });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
      this.getWritingAdvice();
    }
  }

  handleEditorChange(cm: CodeMirror.Editor, change: EditorChange) {
    const currentTime = Date.now();
    this.lastEditTime = currentTime;

    if (this.adviceTimeout) {
      clearTimeout(this.adviceTimeout);
    }

    this.adviceTimeout = setTimeout(() => {
      const timeSinceLastEdit = Date.now() - this.lastEditTime;
      if (timeSinceLastEdit >= 5000) {  // 5 seconds
        this.getWritingAdvice();
      }
    }, 5000);
  }

  async getWritingAdvice() {
    const advice = await this.generateAdvice();
    if (this.adviceView) {
      this.adviceView.setAdvice(advice);
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

interface AiPromptPluginSettings {
  // Add any settings you need
}

const DEFAULT_SETTINGS: AiPromptPluginSettings = {
  // Define default settings
}

class AiPromptSettingTab extends PluginSettingTab {
  plugin: AiPromptPlugin;

  constructor(app: App, plugin: AiPromptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    // Add settings UI here
  }
}