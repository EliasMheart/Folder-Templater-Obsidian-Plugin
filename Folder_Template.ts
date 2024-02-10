import { App, FuzzySuggestModal, TFile } from "obsidian";

// Selection of Templates
export class FolderTemplates extends FuzzySuggestModal<TFile> {

    // This appears to be how you can get a return value from this.
    // Source: https://docs.obsidian.md/Plugins/User+interface/Modals#Accept%20user%20input (on 10.02.2024)
    result:TFile;
    onSubmit:(result:TFile)=>void;

    constructor(app:App, onSubmit:(result:TFile)=>void){
        super(app);
        this.onSubmit = onSubmit;
    }


    getItems(): TFile[] {
        // gets all .md files in the vault (Could be optimized, once I get the settings to work)
// ^TODO
        const files = this.app.vault.getMarkdownFiles();

        // gets name of file and checks if it ends with ".foldertemplate"
        const foldertemplates = files.filter((file) => {
            
            const cache = file.basename;
            return cache.endsWith(".foldertemplate");
            
        });

        return foldertemplates;
    }
    
    
    
    getItemText(item: TFile): string {
        return item.basename;
    }
    
    
    
    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        // "Returns" the selected note, for use in createTemplatedFolder()
        this.result = item
        this.onSubmit(this.result);
        
    }

}

