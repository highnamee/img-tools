import { Input } from "@/components/ui/input";

interface FilenameOptionsControlProps {
  prefix: string;
  onPrefixChange: (val: string) => void;
  suffix: string;
  onSuffixChange: (val: string) => void;
  exampleName?: string;
  format?: string;
}

export function FilenameOptionsControl({
  prefix,
  onPrefixChange,
  suffix,
  onSuffixChange,
  exampleName = "photo",
  format = "png",
}: Readonly<FilenameOptionsControlProps>) {
  const baseName = exampleName.substring(0, exampleName.lastIndexOf(".")) || exampleName;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Filename Options</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Prefix</span>
          <Input
            placeholder="e.g. opt_"
            value={prefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Suffix</span>
          <Input
            placeholder="e.g. _compressed"
            value={suffix}
            onChange={(e) => onSuffixChange(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground truncate">
        Output:{" "}
        <span className="font-mono text-foreground font-medium">
          {prefix}{baseName}{suffix}.{format}
        </span>
      </p>
    </div>
  );
}
