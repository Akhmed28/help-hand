import { FileCode2, FileText, Braces, ChevronRight, FolderOpen } from "lucide-react";

interface FileTreePanelProps {
  hasCode: boolean;
}

const files = [
  { name: "index.html", icon: FileCode2, type: "html" },
  { name: "style.css", icon: FileText, type: "css" },
  { name: "script.js", icon: Braces, type: "js" },
];

const FileTreePanel = ({ hasCode }: FileTreePanelProps) => {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Файлы</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {hasCode ? (
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
              <FolderOpen size={14} />
              <span>project</span>
            </div>
            {files.map((file) => (
              <button
                key={file.name}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors text-left"
              >
                <file.icon size={13} className="text-primary shrink-0" />
                {file.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs text-center px-4">
            Файлы появятся после генерации кода
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Компоненты</h3>
        {hasCode ? (
          <div className="space-y-1">
            {["<header>", "<main>", "<footer>"].map((tag) => (
              <div key={tag} className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                <ChevronRight size={12} />
                <span className="font-mono">{tag}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Нет компонентов</p>
        )}
      </div>
    </div>
  );
};

export default FileTreePanel;
