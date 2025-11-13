import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";

export function NewPostButton() {

  return (
    <Button>
      <PlusIcon />
      New Post
    </Button>
  )
}