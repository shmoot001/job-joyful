import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Trash2, Download, Loader2 } from "lucide-react";
import { useProjectDetails } from "@/hooks/useProjects";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface ProjectAttachmentsProps {
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

export function ProjectAttachments({ projectId }: ProjectAttachmentsProps) {
  const { attachments, uploadAttachment, deleteAttachment, getAttachmentUrl, isUploadingAttachment } = useProjectDetails(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      uploadAttachment({ file, project_id: projectId });
    });

    // Reset input
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bilagor</h3>
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

      <div className="grid gap-3">
        {attachments?.map((attachment) => (
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      deleteAttachment({ id: attachment.id, file_path: attachment.file_path })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!attachments || attachments.length === 0) && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Inga bilagor ännu. Klicka på "Ladda upp" för att lägga till filer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
