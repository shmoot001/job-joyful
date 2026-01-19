import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, File, Trash2, Download, Loader2, FolderPlus, Folder, FolderOpen, ChevronRight, MoreVertical, ArrowLeft } from "lucide-react";
import { useProjectDetails } from "@/hooks/useProjects";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttachmentFoldersProps {
  projectId: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileIcon = (fileType?: string) => {
  if (!fileType) return "📄";
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.startsWith("video/")) return "🎬";
  if (fileType.startsWith("audio/")) return "🎵";
  if (fileType.includes("pdf")) return "📕";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📽️";
  if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
  return "📄";
};

export function AttachmentFolders({ projectId }: AttachmentFoldersProps) {
  const { 
    attachments, 
    uploadAttachment, 
    deleteAttachment, 
    updateAttachment,
    getAttachmentUrl, 
    isUploadingAttachment 
  } = useProjectDetails(projectId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingAttachment, setMovingAttachment] = useState<string | null>(null);

  // Get unique folders
  const folders = [...new Set(
    attachments
      ?.map((a) => a.folder)
      .filter((f): f is string => !!f) || []
  )].sort();

  // Get attachments for current folder
  const currentAttachments = attachments?.filter((a) => 
    currentFolder === null ? !a.folder : a.folder === currentFolder
  ) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      uploadAttachment({ 
        file, 
        project_id: projectId,
        folder: currentFolder || undefined
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (filePath: string, fileName: string, id: string) => {
    setDownloadingId(id);
    try {
      const url = await getAttachmentUrl(filePath);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    // We don't actually create folders in DB - folders are implicit from attachments
    // Instead, we'll navigate to it and it will show as empty
    setCurrentFolder(newFolderName.trim());
    setNewFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleMoveToFolder = (attachmentId: string, folder: string | null) => {
    updateAttachment({ id: attachmentId, folder: folder || undefined });
    setMovingAttachment(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolder !== null && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentFolder(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Tillbaka
            </Button>
          )}
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {currentFolder ? (
              <>
                <FolderOpen className="h-5 w-5 text-primary" />
                {currentFolder}
              </>
            ) : (
              "Bilagor"
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Ny mapp
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAttachment}
          >
            {isUploadingAttachment ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Ladda upp
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {/* Show folders only at root level */}
        {currentFolder === null && folders.map((folder) => {
          const folderAttachments = attachments?.filter((a) => a.folder === folder) || [];
          return (
            <Card 
              key={folder} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentFolder(folder)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Folder className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{folder}</p>
                    <p className="text-xs text-muted-foreground">
                      {folderAttachments.length} fil{folderAttachments.length !== 1 ? "er" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Show attachments */}
        {currentAttachments.map((attachment) => (
          <Card key={attachment.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)} •{" "}
                    {format(new Date(attachment.created_at), "d MMM yyyy", { locale: sv })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      handleDownload(attachment.file_path, attachment.file_name, attachment.id)
                    }
                    disabled={downloadingId === attachment.id}
                  >
                    {downloadingId === attachment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {currentFolder !== null && (
                        <DropdownMenuItem onClick={() => handleMoveToFolder(attachment.id, null)}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Flytta till rot
                        </DropdownMenuItem>
                      )}
                      {folders.filter(f => f !== currentFolder).map((folder) => (
                        <DropdownMenuItem 
                          key={folder}
                          onClick={() => handleMoveToFolder(attachment.id, folder)}
                        >
                          <Folder className="h-4 w-4 mr-2" />
                          Flytta till {folder}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() =>
                          deleteAttachment({ id: attachment.id, file_path: attachment.file_path })
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state */}
        {currentAttachments.length === 0 && (currentFolder !== null || folders.length === 0) && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {currentFolder 
                ? `Inga filer i "${currentFolder}". Klicka på "Ladda upp" för att lägga till.`
                : 'Inga bilagor ännu. Klicka på "Ladda upp" för att lägga till filer.'}
            </p>
          </div>
        )}
      </div>

      {/* Create folder dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Skapa ny mapp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Mappnamn</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="t.ex. Dokument, Bilder..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Skapa mapp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
