import { useState } from "react";
import {
  FileText,
  FilePen,
  FolderTree,
  TerminalSquare,
  ChevronRight,
  Check,
  X,
  Loader2,
  Globe,
} from "lucide-react";

const ICONS = {
  read_file: FileText,
  write_file: FilePen,
  list_dir: FolderTree,
  run_command: TerminalSquare,
};

const LABELS = {
  read_file: "Read file",
  write_file: "Write file",
  list_dir: "List directory",
  run_command: "Run command",
};

function summarize(name, args) {
  if (name === "run_command") return args.command;
  if (name === "write_file") return args.path;
  return args.path;
}

export default function ToolCard({ tool, onApprove, onReject }) {
  const [open, setOpen] = useState(tool.name === "run_command" || tool.name === "write_file");
  const Icon = ICONS[tool.name] || TerminalSquare;
  const pending = tool.status === "pending_approval";
  const running = tool.status === "running";
  const rejected = tool.status === "rejected";

  return (
    <div
      className={`rounded-xl border text-sm overflow-hidden ${
        pending
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03]"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <Icon size={15} className="shrink-0 text-zinc-400" />
        <span className="font-medium text-zinc-300">{LABELS[tool.name] || tool.name}</span>
        <code className="truncate text-zinc-500 text-xs">{summarize(tool.name, tool.arguments)}</code>
        {tool.outside && (
          <span
            title="Reaches outside the workspace folder"
            className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
          >
            <Globe size={10} /> outside
          </span>
        )}
        <span className="ml-auto shrink-0">
          {running && <Loader2 size={14} className="animate-spin text-sky-400" />}
          {tool.status === "done" && <Check size={14} className="text-emerald-400" />}
          {rejected && <X size={14} className="text-rose-400" />}
          {pending && <span className="text-xs text-amber-400">approval needed</span>}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {tool.name === "write_file" && tool.arguments?.content != null && (
            <pre className="max-h-60 overflow-auto rounded-lg bg-[#0d1117] border border-white/10 p-2 text-xs">
              {tool.arguments.content}
            </pre>
          )}
          {tool.result != null && (
            <pre className="max-h-60 overflow-auto rounded-lg bg-[#0d1117] border border-white/10 p-2 text-xs whitespace-pre-wrap">
              {tool.result}
            </pre>
          )}
        </div>
      )}

      {pending && (
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={() => onApprove(tool.call_id)}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Check size={13} /> Approve & run
          </button>
          <button
            onClick={() => onReject(tool.call_id)}
            className="flex items-center gap-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            <X size={13} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
