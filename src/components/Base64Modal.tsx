import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { formatFileSize } from "@/utils/formatUtils";

interface Base64ModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64String: string;
  htmlImgTag: string;
  fileName: string;
  originalSize: number;
}

export function Base64Modal({
  isOpen,
  onClose,
  base64String,
  htmlImgTag,
  fileName,
  originalSize,
}: Readonly<Base64ModalProps>) {
  const base64Size = new Blob([base64String]).size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-[1280px]">
        <DialogHeader>
          <DialogTitle>Base64 Output - {fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="text-muted-foreground text-sm">
            <span>Original: {formatFileSize(originalSize)}</span>
            <span className="mx-2">•</span>
            <span>Base64: {formatFileSize(base64Size)}</span>
          </div>

          <Tabs defaultValue="base64">
            <TabsList className="mb-2">
              <TabsTrigger value="base64">Base64 String</TabsTrigger>
              <TabsTrigger value="html">HTML Tag</TabsTrigger>
            </TabsList>
            <TabsContent value="base64" className="relative">
              <div className="mb-2 flex justify-end">
                <CopyButton text={base64String} label="Copy to Clipboard" />
              </div>
              <Textarea
                className="h-[60vh] font-mono text-sm break-all whitespace-pre-wrap"
                readOnly
                value={base64String}
              />
            </TabsContent>
            <TabsContent value="html" className="relative">
              <div className="mb-2 flex justify-end">
                <CopyButton text={htmlImgTag} label="Copy to Clipboard" />
              </div>
              <Textarea
                className="h-[60vh] font-mono text-sm break-all whitespace-pre-wrap"
                readOnly
                value={htmlImgTag}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
