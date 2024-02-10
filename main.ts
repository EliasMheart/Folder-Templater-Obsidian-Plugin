import { FolderTemplates } from 'Folder_Template';
import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, } from 'obsidian';

// Remember to rename these classes and interfaces!
// TODO

interface MyPluginSettings {
	folder_template_folder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	folder_template_folder: ''
}

// Plugin Class for using Folder Templates
export default class FolderTemplatesPlugin extends Plugin {
	settings: MyPluginSettings;

///****************** Class-Attributes ******************///

// TODO - Use the settings. 
	folderTemplateFolderPath: string; 



///****************** Methods ******************///
	// Adds a folder named foldername at the location specified by parentfolderpath+pathAddon and returns an updated pathAddon
	addFolder(parentFolderPath:string, folderName:string, pathAddon:string):string{
		
		// pathAddon is appended with a backslash and the folderName, which is framed by "" to avoid issues.
		const newPathAddon = pathAddon + "/" + folderName;
		
		// New folder is created as a subfolder at the current depth.
		this.app.vault.createFolder(parentFolderPath + newPathAddon);

		return newPathAddon;

	}

	// Takes the last "\whatever" off of the current pathAddon and returns the resulting string.
	removeLastFolder(pathAddon:string):string{
		if(pathAddon.endsWith("/")){
			pathAddon = pathAddon.slice(0,pathAddon.length-1);
		}
		const lastFolder = pathAddon.split("/");
		const offset = lastFolder[(lastFolder.length > 0)?(lastFolder.length-1):(0)].length;
		const newPathAddon = pathAddon.slice(0,pathAddon.length-offset);

		return (newPathAddon.length>0)?(newPathAddon):("");
	}

	// Core Function. Reads selected file and creates a Folder structure accordingly, filling it with Notes as indicated.
	async createTemplatedFolder(file: TFile){
		const data = await this.app.vault.cachedRead(file);

		const lineByLine = data.split("\n");		
		
		// Current Addition to the path -> For Adding things at the current folder-level
		let pathAddon: string | undefined;
		// How deep in the folder structure are we?
		let currentDepth: number | undefined;
		
		// Not sure if this is needed in .ts, probably covered by undefined, but whatever.
		pathAddon = "";
		currentDepth = 0;


		// Name to be input by the user when calling the command, but how to get that is unclear so far.
		const parentFolderName = "HowDoIGetInputFromUser";
		// Get parentFolderPath
		const parentFolderPath = this.app.vault.getRoot().path+parentFolderName;
		// Create Parent Folder
		this.app.vault.createFolder(parentFolderPath);
		

		
		// Applies the template to the vault.
		for (let i=0;i <lineByLine.length;i++){
			// Really, this should be switch case, I guess, but I can't figure that out right now^^
			// Save the current line being worked on to const for increased readability
			const line = lineByLine[i];

			// If it's a heading, it becomes a folder.
			if (line?.startsWith("#")){

				// How many "#" were there?
				const newDepth = line.split(" ",1)[0].length-1;
				
				// Get folder name from line. "## Subheading" -> folderName = "Subheading"
				const folderName = line.slice(line.split(" ",2)[0].length).trimStart();

				// This is a new folder at the same level, so not a new subfolder
				if(currentDepth == newDepth){
					// Therefore, we remove the last folder that was just added from the pathAddon, before adding this folder.
					pathAddon = this.addFolder(parentFolderPath, folderName, this.removeLastFolder(pathAddon));
				}
				else{
					// This is a subfolder
					if(currentDepth < newDepth){
						pathAddon = this.addFolder(parentFolderPath, folderName, pathAddon);
					}
					// This is a new folder on a higher level.
					else{
						// Going up in the folder structure until we reach the desired depth:
						for(let i = 0;i < ((currentDepth-newDepth)+1);i++){
							pathAddon = this.removeLastFolder(pathAddon);
						}
						pathAddon = this.addFolder(parentFolderPath, folderName , pathAddon);
					}
					// In either case, update currentDepth
					currentDepth = newDepth;
				}
			}
			else{
			// If it's a bullet point, it becomes a note.
				if (line?.startsWith("- ")){

					// This is a new note at the current pathAddon/Depth
					const nodeName = line.slice(2);
					
					const nodePath = (pathAddon.length>0)?(parentFolderPath +pathAddon+"/"+nodeName+".md"):(parentFolderPath+nodeName+".md") ;

					// Potential to add the use of templates for note creation here... We'll see.
					// For now, just create the note:
					this.app.vault.create(nodePath, "");
				}
				

			}
		}
	} // createTemplatedFolder()



///****************** OnLoad ******************///

	async onload() {
		await this.loadSettings();



///****************** Commands ******************///
		
		this.addCommand({
			id: 'create-folder-template-folder',
			name: 'Create Folder-Templated Folder',
			callback: () => {
				new FolderTemplates(this.app,(result)=>{
					this.createTemplatedFolder(result)
				}).open();
			}
		});



///****************** Ribbons ******************///

		this.addRibbonIcon("file", "FolderTemplate",()=>{
			new FolderTemplates(this.app,(result)=>{
				this.createTemplatedFolder(result)
			}).open();
		});



///****************** Settings ******************///

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));



///****************** Registrations ******************///

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	} // onload()



	onunload() {

	} // onunload()



	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}



	async saveSettings() {
		await this.saveData(this.settings);
	}
} // class Plugin



///****************** Interfaces ******************///



///****************** Settings ******************///
class SampleSettingTab extends PluginSettingTab {
	plugin: FolderTemplatesPlugin;

	constructor(app: App, plugin: FolderTemplatesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Folder-template folder')
			.setDesc('Name of the folder which holds your folder-templates')
			.addText(text => text
				.setPlaceholder('Enter your folder-template folder')
				.setValue(this.plugin.settings.folder_template_folder)
				.onChange(async (value) => {
					this.plugin.settings.folder_template_folder = value;
					await this.plugin.saveSettings();
				}));
	}
} // class Settings()
