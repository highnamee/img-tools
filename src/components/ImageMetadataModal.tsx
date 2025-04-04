import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetadataField } from "@/services/metadataService";

interface ImageMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MetadataField[];
}

export function ImageMetadataModal({
  isOpen,
  onClose,
  metadata,
}: Readonly<ImageMetadataModalProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>All Metadata Fields</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 p-4">
            {metadata.map((field) => (
              <div key={field.name} className="flex items-center gap-2 text-sm">
                <span className="min-w-1/3 font-medium">{field.name}</span>
                <span className="text-muted-foreground ml-2">{field.value}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
