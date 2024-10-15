import { Plugin, WorkspaceLeaf, ItemView, Notice, MarkdownView, EditorChange, PluginSettingTab, App } from 'obsidian';

class AdviceView extends ItemView {
  private content: string = '';

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

    this.addRibbonIcon('bulb', 'Toggle AIdvice', () => {
      this.toggleAdviceView();
    });

    this.addCommand({
      id: 'toggle-writing-advice',
      name: 'Toggle AIdvice',
      callback: () => this.toggleAdviceView()
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on('change', this.handleEditorChange.bind(this));
    });

    this.addSettingTab(new AiPromptSettingTab(this.app, this));

    await this.activateView();
    console.log('AiPromptPlugin loaded and view activated');
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
      // Try to create a new leaf, but handle potential errors
      try {
        leaf = workspace.getRightLeaf(false);
        if (!leaf) {
          console.error('Failed to get right leaf');
          return;
        }
        await leaf.setViewState({ type: "advice-view", active: true });
      } catch (error) {
        console.error('Error creating advice view:', error);
        new Notice('Failed to create advice view. Please try reloading Obsidian.');
        return;
      }
    }

    if (leaf) {
      try {
        workspace.revealLeaf(leaf);
        this.getWritingAdvice();
      } catch (error) {
        console.error('Error revealing leaf or getting writing advice:', error);
        new Notice('Error displaying advice view. Please try again.');
      }
    } else {
      console.error('Failed to create or find advice view leaf');
      new Notice('Failed to create advice view. Please try reloading Obsidian.');
    }
  }


  handleEditorChange(cm: CodeMirror.Editor, change: EditorChange) {
    console.log('Editor change detected');
    const currentTime = Date.now();
    this.lastEditTime = currentTime;

    if (this.adviceTimeout) {
      clearTimeout(this.adviceTimeout);
    }

    this.adviceTimeout = setTimeout(() => {
      const timeSinceLastEdit = Date.now() - this.lastEditTime;
      console.log(`Time since last edit: ${timeSinceLastEdit}ms`);
      if (timeSinceLastEdit >= 5000) {  // 5 seconds
        this.getWritingAdvice();
      }
    }, 5000);
  }

  async getWritingAdvice() {
    const advice = await this.generateAdvice();
    console.log('Generated advice:', advice);
    if (this.adviceView) {
      this.adviceView.setAdvice(advice);
    } else {
      console.error('AdviceView is not initialized');
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