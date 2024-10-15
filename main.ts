import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, ButtonComponent } from 'obsidian';

interface AiPromptPluginSettings {
  adviceScope: string;
  claudeApiKey: string;
}

const DEFAULT_SETTINGS: AiPromptPluginSettings = {
  adviceScope: 'Provide writing advice for creative fiction.',
  claudeApiKey: '',
}

class AdviceView extends ItemView {
  private content: string = '';
  private adviceButton: ButtonComponent;

  constructor(leaf: WorkspaceLeaf, private getAdviceCallback: () => void) {
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
    
    const buttonContainer = container.createEl("div");
    this.adviceButton = new ButtonComponent(buttonContainer)
      .setButtonText("Get Advice")
      .onClick(() => {
        this.getAdviceCallback();
      });

    container.createEl("p", { text: this.content });
  }
}

export default class AiPromptPlugin extends Plugin {
  private adviceView: AdviceView;
  settings: AiPromptPluginSettings;

  async onload() {
    console.log('AiPromptPlugin onload started');

    await this.loadSettings();

    this.registerView(
      "advice-view",
      (leaf) => {
        this.adviceView = new AdviceView(leaf, () => this.getWritingAdvice());
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

    this.addSettingTab(new AiPromptSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      console.log('Layout ready, activating view');
      this.activateView();
    });

    console.log('AiPromptPlugin onload completed');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
    } else {
      console.log('Failed to create or find advice view leaf');
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
    if (!this.settings.claudeApiKey) {
      return "Please set your Claude API key in the plugin settings.";
    }

    // Here you would typically make an API call to Claude
    // For this example, we'll just return the advice scope
    return `Based on your settings, here's some advice: ${this.settings.adviceScope}`;

    // TODO: Implement actual API call to Claude
    // const response = await fetch('https://api.anthropic.com/v1/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.settings.claudeApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     model: "claude-2",
    //     prompt: `${this.settings.adviceScope}\n\nHuman: Please provide writing advice.\n\nAssistant:`,
    //     max_tokens_to_sample: 300,
    //   }),
    // });
    // const data = await response.json();
    // return data.completion;
  }
}

class AiPromptSettingTab extends PluginSettingTab {
  plugin: AiPromptPlugin;

  constructor(app: App, plugin: AiPromptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const {containerEl} = this;

    containerEl.empty();

    containerEl.createEl('h2', {text: 'AIdvice Settings'});

    new Setting(containerEl)
      .setName('Claude API Key')
      .setDesc('Enter your Claude API key')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.claudeApiKey)
        .onChange(async (value) => {
          this.plugin.settings.claudeApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Advice Scope')
      .setDesc('Enter the scope or context for the writing advice')
      .addTextArea(text => text
        .setPlaceholder('E.g., Provide writing advice for creative fiction. Focus on character development and plot structure.')
        .setValue(this.plugin.settings.adviceScope)
        .onChange(async (value) => {
          this.plugin.settings.adviceScope = value;
          await this.plugin.saveSettings();
        }))
      .then((setting) => {
        // Adjust the height of the text area
        const textArea = setting.controlEl.querySelector('textarea');
        if (textArea) {
          textArea.style.minHeight = '100px';
          textArea.style.width = '100%';
        }
      });
  }
}