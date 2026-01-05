import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
        <p className="text-primary-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
