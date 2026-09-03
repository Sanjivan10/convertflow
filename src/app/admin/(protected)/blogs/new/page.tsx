import { BlogEditor } from "@/components/admin/blog-editor";

export default function NewBlogPost() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New post</h1>
      <BlogEditor />
    </div>
  );
}
