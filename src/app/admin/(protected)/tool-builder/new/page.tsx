import { ToolForm } from "@/components/admin/tool-form";

export default function NewTool() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New tool</h1>
      <ToolForm />
    </div>
  );
}
